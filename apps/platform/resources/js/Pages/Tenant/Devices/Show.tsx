import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Copy, KeyRound, RefreshCw, LogOut, PowerOff, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import { io, type Socket } from 'socket.io-client';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { FormField } from '@/Components/ui/FormField';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import TenantShell from '@/Layouts/TenantShell';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/Lib/api-client';

type Integration = {
    username: string;
    device_name: string;
    device_id: string;
    api_key_prefix?: string | null;
    api_key?: string;
    has_api_key: boolean;
};

type Device = {
    id: string;
    name: string;
    status: string;
    phone_e164: string | null;
    display_name?: string | null;
};

type Props = {
    deviceUlid: string;
    engine: string;
    pairingAvailable: boolean;
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'جهاز جديد',
    starting: 'جارٍ التجهيز',
    waiting_for_qr: 'امسح الرمز من واتساب',
    qr_required: 'يلزم مسح رمز QR',
    pairing: 'جارٍ الاتصال...',
    connecting: 'جارٍ الاتصال...',
    connected: 'متصل وجاهز',
    disconnected: 'غير متصل',
    reconnecting: 'جارٍ استعادة الاتصال...',
    logged_out: 'تم تسجيل الخروج',
    failed: 'فشل الاتصال',
    error: 'خطأ في الاتصال',
};

export default function DeviceShow({ deviceUlid, engine, pairingAvailable }: Props) {
    const [device, setDevice] = useState<Device | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Test Message State
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('رسالة اختبار من مراسيل 🚀');
    const [testResult, setTestResult] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null);

    // Dialog State
    const [confirmAction, setConfirmAction] = useState<'disconnect' | 'logout' | 'delete' | null>(null);
    const [editName, setEditName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [integration, setIntegration] = useState<Integration | null>(null);
    const [rotatingKey, setRotatingKey] = useState(false);
    const connectStarted = useRef(false);

    const load = useCallback(async () => {
        try {
            const res = await apiGet<{ device: Device; integration: Integration }>(`/devices/${deviceUlid}`);
            if (res.success && res.data) {
                setDevice(res.data.device);
                setEditName(res.data.device.name);
                setIntegration(res.data.integration);
            }
        } catch {
            setError('تعذر جلب بيانات الجهاز.');
        }
    }, [deviceUlid]);

    const loadRef = useRef(load);

    useEffect(() => {
        loadRef.current = load;
    }, [load]);

    const applyDevicePatch = useCallback((patch: Partial<Device>) => {
        setDevice((prev) => (prev ? { ...prev, ...patch } : prev));
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Poll while pairing — WebSocket may miss events (service restart, token expiry, race with API).
    useEffect(() => {
        if (!device) {
            return;
        }
        const terminal = ['connected', 'failed', 'error', 'logged_out'];
        if (terminal.includes(device.status)) {
            return;
        }
        const interval = window.setInterval(() => {
            void loadRef.current();
        }, 3000);
        return () => window.clearInterval(interval);
    }, [device?.status, device]);

    // QR Countdown Timer
    useEffect(() => {
        if (seconds <= 0) {
            if (seconds === 0) setQrImage(null);
            return;
        }
        const timer = window.setTimeout(() => setSeconds((v) => v - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [seconds]);

    // WebSocket Integration
    useEffect(() => {
        if (!pairingAvailable) return;
        let socket: Socket | undefined;
        let cancelled = false;

        async function fetchSocketToken(): Promise<string | null> {
            const res = await apiPost<{ token: string }>(`/devices/${deviceUlid}/socket-token`, {});
            return res.success && res.data ? res.data.token : null;
        }

        async function syncDevice(delayMs = 0) {
            if (delayMs > 0) {
                await new Promise((resolve) => window.setTimeout(resolve, delayMs));
            }
            if (!cancelled) {
                await loadRef.current();
            }
        }

        void (async () => {
            const token = await fetchSocketToken();
            if (!token || cancelled) return;

            socket = io({
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                auth: { token },
            });

            socket.io.on('reconnect_attempt', () => {
                void fetchSocketToken().then((fresh) => {
                    if (fresh && socket) {
                        socket.auth = { token: fresh };
                    }
                });
            });

            socket.on('device.qr_ready', (event: { qr: string; expires_in: number }) => {
                void QRCode.toDataURL(event.qr, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
                    .then(setQrImage);
                setSeconds(event.expires_in);
                setError(null);
                applyDevicePatch({ status: 'waiting_for_qr' });
            });

            const statusMap: Record<string, string> = {
                'device.starting': 'starting',
                'device.connecting': 'connecting',
                'device.reconnecting': 'reconnecting',
                'device.disconnected': 'disconnected',
                'device.logged_out': 'logged_out',
            };

            for (const [eventName, status] of Object.entries(statusMap)) {
                socket.on(eventName, () => {
                    applyDevicePatch({ status });
                    void syncDevice();
                });
            }

            socket.on('device.connected', (event: { phone_number?: string; display_name?: string }) => {
                setQrImage(null);
                setSeconds(0);
                setError(null);
                const phone = event.phone_number
                    ? `+${String(event.phone_number).replace(/^\+/, '')}`
                    : undefined;
                applyDevicePatch({
                    status: 'connected',
                    ...(phone ? { phone_e164: phone } : {}),
                    ...(event.display_name ? { display_name: event.display_name } : {}),
                });
                void syncDevice(400);
                void syncDevice(1500);
            });

            socket.on('device.error', () => {
                setError('تعذر إكمال الربط. حاول مجدداً أو تواصل مع الدعم.');
                applyDevicePatch({ status: 'failed' });
                void syncDevice();
            });

            socket.on('connect_error', () => {
                // Polling keeps the UI in sync if the socket drops.
            });
        })();

        return () => {
            cancelled = true;
            socket?.disconnect();
        };
    }, [deviceUlid, pairingAvailable, applyDevicePatch]);

    const handleAction = useCallback(async (action: 'connect' | 'disconnect' | 'logout') => {
        setBusy(true);
        setError(null);
        try {
            await apiPost(`/devices/${deviceUlid}/${action}`, {});
            await load();
            setConfirmAction(null);
        } catch {
            setError('تعذر تنفيذ العملية المطلوبة.');
        } finally {
            setBusy(false);
        }
    }, [deviceUlid, load]);

    useEffect(() => {
        if (!pairingAvailable || !device || device.status === 'connected' || connectStarted.current) {
            return;
        }
        connectStarted.current = true;
        void handleAction('connect');
    }, [device, pairingAvailable, handleAction]);

    async function rotateIntegrationKey() {
        setRotatingKey(true);
        setError(null);
        try {
            const res = await apiPost<{ integration: Integration }>(`/devices/${deviceUlid}/rotate-api-key`, {});
            if (!res.success) {
                setError(res.error?.message ?? 'تعذر تجديد مفتاح الربط.');
                return;
            }
            if (!res.data?.integration) {
                setError('تعذر تجديد مفتاح الربط.');
                return;
            }
            setIntegration(res.data.integration);
        } catch {
            setError('تعذر تجديد مفتاح الربط.');
        } finally {
            setRotatingKey(false);
        }
    }

    async function copyText(value: string) {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // ignore
        }
    }

    async function saveName() {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === device?.name) {
            return;
        }
        setSavingName(true);
        setError(null);
        try {
            const res = await apiPatch<{ device: Device }>(`/devices/${deviceUlid}`, { name: trimmed });
            if (!res.success) {
                setError(res.error?.message ?? 'تعذر حفظ الاسم.');
                return;
            }
            await load();
        } catch {
            setError('تعذر حفظ الاسم.');
        } finally {
            setSavingName(false);
        }
    }

    async function deleteDevice() {
        setBusy(true);
        setError(null);
        try {
            const res = await apiDelete(`/devices/${deviceUlid}`);
            if (!res.success) {
                setError(res.error?.message ?? 'تعذر حذف الجهاز.');
                return;
            }
            router.visit('/devices');
        } catch {
            setError('تعذر حذف الجهاز.');
        } finally {
            setBusy(false);
            setConfirmAction(null);
        }
    }

    async function sendTestMessage() {
        setBusy(true);
        setTestResult(null);
        const key = crypto.randomUUID();

        try {
            const res = await apiPost<{ message: { id: string; status: string } }>(
                `/devices/${deviceUlid}/test-message`,
                { to: recipient, message, consent_confirmed: true },
                { headers: { 'Idempotency-Key': key } }
            );

            if (res.success && res.data) {
                setTestResult({
                    tone: 'success',
                    message: `تم الإرسال بنجاح! معرّف الرسالة: ${res.data.message.id} (${res.data.message.status})`
                });
            } else if (!res.success) {
                setTestResult({
                    tone: 'danger',
                    message: res.error?.message ?? 'فشل إرسال الرسالة.'
                });
            }
        } catch {
            setTestResult({
                tone: 'danger',
                message: 'تعذر قبول رسالة الاختبار. تأكد من صحة الرقم ومن رصيد خطتك.'
            });
        } finally {
            setBusy(false);
        }
    }

    const isConnected = device?.status === 'connected';
    const currentLabel = STATUS_LABELS[device?.status ?? 'pending'] ?? device?.status;

    return (
        <TenantShell
            title={device?.name ?? 'إدارة الجهاز'}
            description="اربط جهازك بواتساب لمزامنة الجلسة والبدء بالإرسال عبر المنصة."
            width="narrow"
            headerActions={
                <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-700))] transition-colors">
                    <ArrowRight className="size-4" />
                    عودة للأجهزة
                </Link>
            }
        >
            <div className="space-y-6">
                <div>
                    <TenantPanel
                        title="حالة الاتصال"
                        action={
                            device ? (
                                <Badge tone={isConnected ? 'success' : 'neutral'}>
                                    {currentLabel}
                                </Badge>
                            ) : null
                        }
                    >
                        {isConnected ? (
                            <div className="py-8 text-center">
                                <div className="inline-flex items-center justify-center size-20 rounded-full bg-[rgb(var(--success-50))] text-[rgb(var(--success-600))] mb-4 ring-8 ring-[rgb(var(--success-50))/0.5]">
                                    <CheckCircle2 className="size-10" />
                                </div>
                                <h2 className="text-h2 text-[rgb(var(--brand-950))]">تم ربط الجهاز بنجاح</h2>
                                <p className="mt-2 text-body-lg text-[rgb(var(--muted))]" dir="ltr">
                                    {device.phone_e164 ?? device.display_name}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                {qrImage ? (
                                    <div className="mt-2 text-center w-full max-w-sm">
                                        <div className="relative p-4 rounded-[var(--radius-xl)] bg-white border border-[rgb(var(--border-subtle))] shadow-[var(--shadow-md)]">
                                            <img src={qrImage} alt="QR Code" className="mx-auto w-full aspect-square" />
                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[var(--radius-xl)] pointer-events-none" />
                                        </div>
                                        <p className="mt-4 text-sm font-medium text-[rgb(var(--brand-700))]">
                                            ينتهي الرمز خلال <span className="font-tabular text-lg">{seconds}</span> ثانية
                                        </p>
                                    </div>
                                ) : (
                                    pairingAvailable && (
                                        <div className="py-12 flex flex-col items-center text-center">
                                            <RefreshCw className="size-12 text-[rgb(var(--brand-300))] mb-4 animate-spin" />
                                            <p className="text-body text-[rgb(var(--muted))]">{currentLabel}</p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {!pairingAvailable && !isConnected && (
                            <Alert tone="warning" title="الربط غير متاح" className="mt-6">
                                المحرك الحالي ({engine}) لا يدعم QR. عيّن <code dir="ltr">WHATSAPP_ENGINE=baileys</code> في .env
                                ثم أعد تشغيل حاوية api.
                            </Alert>
                        )}

                        {!isConnected && (
                            <div className="mt-8 pt-6 border-t border-[rgb(var(--border-soft))]">
                                <h4 className="text-label text-[rgb(var(--brand-950))] mb-4">خطوات الربط:</h4>
                                <ol className="list-decimal list-inside space-y-3 text-body-sm text-[rgb(var(--muted))] marker:text-[rgb(var(--brand-400))] marker:font-bold">
                                    <li>افتح تطبيق واتساب على هاتفك المحمول.</li>
                                    <li>انتقل إلى <strong>الإعدادات</strong> (Settings).</li>
                                    <li>اختر <strong>الأجهزة المرتبطة</strong> (Linked Devices).</li>
                                    <li>اضغط على <strong>ربط جهاز</strong> (Link a Device).</li>
                                    <li>امسح الرمز المعروض أعلاه عبر كاميرا الهاتف وانتظر الاتصال.</li>
                                </ol>
                            </div>
                        )}

                        {error && (
                            <Alert tone="danger" title="حدث خطأ" className="mt-6">
                                {error}
                            </Alert>
                        )}

                        <div className="mt-8 flex flex-wrap gap-3">
                            {!isConnected && (
                                <Button
                                    disabled={busy || !pairingAvailable}
                                    onClick={() => void handleAction('connect')}
                                    className="w-full sm:w-auto"
                                >
                                    <RefreshCw className="size-4" />
                                    {qrImage ? 'تحديث الرمز' : 'بدء الاتصال'}
                                </Button>
                            )}
                            
                            {isConnected && (
                                <Button
                                    variant="secondary"
                                    disabled={busy}
                                    onClick={() => setConfirmAction('disconnect')}
                                >
                                    <PowerOff className="size-4" />
                                    فصل مؤقت
                                </Button>
                            )}

                            {(isConnected || qrImage) && (
                                <Button
                                    variant="danger"
                                    disabled={busy}
                                    onClick={() => setConfirmAction('logout')}
                                >
                                    <LogOut className="size-4" />
                                    تسجيل الخروج
                                </Button>
                            )}

                            <Button
                                variant="danger"
                                disabled={busy}
                                onClick={() => setConfirmAction('delete')}
                            >
                                <Trash2 className="size-4" />
                                حذف الجهاز
                            </Button>
                        </div>
                    </TenantPanel>
                </div>

                <div>
                    <TenantPanel
                        title="ربط المنصات الخارجية"
                        description="أعطِ شريكك هذه البيانات مرة واحدة — كل جهاز له API Key خاص به."
                    >
                        {integration ? (
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField id="integration-username" label="اسم المستخدم (Username)">
                                        <div className="flex gap-2">
                                            <Input id="integration-username" dir="ltr" readOnly value={integration.username} />
                                            <Button type="button" variant="secondary" size="sm" onClick={() => void copyText(integration.username)}>
                                                <Copy className="size-4" />
                                            </Button>
                                        </div>
                                    </FormField>
                                    <FormField id="integration-device-name" label="اسم الجهاز">
                                        <Input id="integration-device-name" readOnly value={integration.device_name} />
                                    </FormField>
                                </div>

                                {!integration.api_key && integration.has_api_key ? (
                                    <Alert tone="warning" title="المفتاح غير مخزّن للعرض">
                                        اضغط «تجديد API Key» مرة واحدة — بعدها يبقى ظاهراً دائماً.
                                    </Alert>
                                ) : null}

                                <FormField
                                    id="integration-api-key"
                                    label="API Key"
                                    hint="المفتاح ثابت لهذا الجهاز — انسخه وأعطِه لشريكك."
                                >
                                    <div className="flex gap-2">
                                        <Input
                                            id="integration-api-key"
                                            dir="ltr"
                                            readOnly
                                            value={integration.api_key ?? `${integration.api_key_prefix ?? ''}••••••••`}
                                        />
                                        {integration.api_key ? (
                                            <Button type="button" variant="secondary" size="sm" onClick={() => void copyText(integration.api_key!)}>
                                                <Copy className="size-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                </FormField>

                                <Alert tone="neutral" title="طريقة الاستخدام">
                                    <code dir="ltr" className="block text-sm">
                                        POST /api/v1/messages/text<br />
                                        Authorization: Bearer {'{api_key}'}<br />
                                        {'{ "to": "+9639...", "message": "..." }'}
                                    </code>
                                </Alert>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    loading={rotatingKey}
                                    onClick={() => void rotateIntegrationKey()}
                                    className="w-full sm:w-auto"
                                >
                                    <KeyRound className="size-4" />
                                    تجديد API Key
                                </Button>
                            </div>
                        ) : (
                            <p className="text-body-sm text-[rgb(var(--muted))]">جارٍ تحميل بيانات الربط...</p>
                        )}
                    </TenantPanel>
                </div>

                <div>
                    <TenantPanel title="تعديل الجهاز" description="غيّر الاسم المعروض في لوحة التحكم.">
                        <div className="tenant-toolbar">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="اسم الجهاز" />
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={savingName || !editName.trim() || editName.trim() === device?.name}
                                loading={savingName}
                                onClick={() => void saveName()}
                                className="w-full sm:w-auto"
                            >
                                حفظ الاسم
                            </Button>
                        </div>
                    </TenantPanel>
                </div>

                {isConnected && (
                    <div>
                        <TenantPanel
                            title="تجربة الإرسال"
                            description="أرسل رسالة تجريبية للتأكد من فاعلية الاتصال بالمنصة."
                        >
                            <div className="space-y-5">
                                <FormField id="test-recipient" label="رقم المستلم (E.164)" hint="مثال: +9639xxxxxxxx">
                                    <Input
                                        id="test-recipient"
                                        dir="ltr"
                                        placeholder="+905xxxxxxxxx"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                    />
                                </FormField>
                                <FormField id="test-message" label="محتوى الرسالة">
                                    <Textarea
                                        id="test-message"
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="اكتب رسالتك هنا..."
                                    />
                                </FormField>

                                {testResult && (
                                    <Alert tone={testResult.tone} title={testResult.tone === 'success' ? 'نجاح' : 'خطأ'}>
                                        {testResult.message}
                                    </Alert>
                                )}

                                <Button
                                    loading={busy}
                                    disabled={!/^\+[1-9]\d{7,14}$/.test(recipient) || !message.trim()}
                                    onClick={() => void sendTestMessage()}
                                    className="w-full sm:w-auto"
                                >
                                    إرسال الرسالة
                                </Button>
                            </div>
                        </TenantPanel>
                    </div>
                )}
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={confirmAction === 'delete'}
                onOpenChange={(v) => !v && setConfirmAction(null)}
                title="حذف الجهاز"
                description="سيتم حذف الجهاز نهائياً وإنهاء أي جلسة مرتبطة. لا يمكن التراجع."
                confirmLabel="حذف"
                tone="danger"
                loading={busy}
                onConfirm={deleteDevice}
            />

            <ConfirmDialog
                open={confirmAction === 'logout'}
                onOpenChange={(v) => !v && setConfirmAction(null)}
                title="تسجيل الخروج من الجهاز"
                description="تسجيل الخروج سيؤدي إلى إنهاء الجلسة بالكامل. ستحتاج إلى مسح رمز QR جديد للاتصال مرة أخرى. هل أنت متأكد؟"
                confirmLabel="نعم، تسجيل الخروج"
                tone="danger"
                onConfirm={() => handleAction('logout')}
            />
            
            <ConfirmDialog
                open={confirmAction === 'disconnect'}
                onOpenChange={(v) => !v && setConfirmAction(null)}
                title="فصل الجهاز مؤقتاً"
                description="سيتم إيقاف الاتصال مؤقتاً، ولكن سيتم الاحتفاظ ببيانات الجلسة للاتصال لاحقاً بدون مسح الرمز. هل ترغب بالاستمرار؟"
                confirmLabel="تأكيد الفصل"
                tone="danger"
                onConfirm={() => handleAction('disconnect')}
            />
        </TenantShell>
    );
}
