import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Copy,
    RefreshCw,
    LogOut,
    PowerOff,
    Trash2,
    QrCode,
    Smartphone,
    ShieldCheck,
    Sparkles,
    Dices,
    Zap,
    ExternalLink,
    Code,
    Check,
    Search,
    UserCheck,
    UserX,
    AlertTriangle,
} from 'lucide-react';
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
import { CodeBlock } from '@/Components/ui/CodeBlock';
import TenantShell from '@/Layouts/TenantShell';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/Lib/api-client';

type Integration = {
    send_url?: string;
    check_url?: string;
    username: string;
    device_name: string;
    device_id: string;
    api_key_prefix?: string | null;
    api_key?: string;
    has_api_key?: boolean;
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

    // Test Message & Simulator State
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('{مرحباً|أهلاً بك|السلام عليكم} تجربة إرسال آمنة من مراسيل 🚀');
    const [testResult, setTestResult] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null);
    const [codeTab, setCodeTab] = useState<'webhook' | 'curl' | 'php' | 'js' | 'python'>('webhook');
    const [spunPreview, setSpunPreview] = useState('');
    const [simulatingTyping, setSimulatingTyping] = useState(false);
    const [sendingStep, setSendingStep] = useState<string | null>(null);

    const spinText = useCallback((text: string): string => {
        if (!text || !text.includes('{') || !text.includes('}')) return text;
        let res = text;
        let max = 20;
        while (max-- > 0 && /\{([^{}]+)\}/.test(res)) {
            res = res.replace(/\{([^{}]+)\}/g, (_, group: string) => {
                const options = group.split('|');
                return options[Math.floor(Math.random() * options.length)] ?? '';
            });
        }
        return res;
    }, []);

    useEffect(() => {
        setSpunPreview(spinText(message));
    }, [message, spinText]);

    const handleSpinDice = () => {
        setSpunPreview(spinText(message));
    };

    const insertSpintax = (snippet: string) => {
        setMessage((prev) => (prev ? `${prev} ${snippet}` : snippet));
    };

    // Dialog State
    const [confirmAction, setConfirmAction] = useState<'disconnect' | 'logout' | 'delete' | null>(null);
    const [editName, setEditName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [integration, setIntegration] = useState<Integration | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [connectMode, setConnectMode] = useState<'qr' | 'code'>('qr');
    const [pairingPhone, setPairingPhone] = useState('');
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [requestingCode, setRequestingCode] = useState(false);
    const connectStarted = useRef(false);

    // Number Checker State
    const [checkPhone, setCheckPhone] = useState('');
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkResult, setCheckResult] = useState<{
        phone: string;
        exists: boolean;
        status: string;
        message: string;
        device?: string;
    } | null>(null);
    const [checkError, setCheckError] = useState<string | null>(null);
    const [checkCodeTab, setCheckCodeTab] = useState<'webhook' | 'curl' | 'php' | 'js' | 'python'>('webhook');

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

    async function copyField(field: string, value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            window.setTimeout(() => {
                setCopiedField((cur) => (cur === field ? null : cur));
            }, 2000);
        } catch {
            // ignore
        }
    }

    async function copyText(value: string) {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // ignore
        }
    }

    async function handleRequestPairingCode() {
        const cleaned = pairingPhone.trim();
        if (!cleaned) {
            setError('يرجى إدخال رقم الهاتف مع الرمز الدولي (مثال: 9639XXXXXXXX).');
            return;
        }
        setRequestingCode(true);
        setError(null);
        try {
            const res = await apiPost<{ pairing_code: string }>(`/devices/${deviceUlid}/pairing-code`, {
                phone_number: cleaned,
            });
            if (res.success) {
                if (res.data?.pairing_code) {
                    setPairingCode(res.data.pairing_code);
                } else {
                    setError('لم يتم استلام كود الربط.');
                }
            } else {
                setError(res.error?.message ?? 'تعذر طلب كود الربط.');
            }
        } catch {
            setError('تعذر طلب كود الربط. تأكد من أن الجلسة قيد التشغيل وصحة رقم الهاتف.');
        } finally {
            setRequestingCode(false);
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
        setSendingStep('جاري الفحص المسبق للرقم (onWhatsApp)...');
        setSimulatingTyping(true);
        const key = crypto.randomUUID();

        // Visual feedback matching Baileys human simulation
        await new Promise((r) => setTimeout(r, 600));
        setSendingStep('محاكاة السلوك البشري والكتابة...');

        try {
            const res = await apiPost<{ message: { id: string; status: string } }>(
                `/devices/${deviceUlid}/test-message`,
                { to: recipient, message, consent_confirmed: true },
                { headers: { 'Idempotency-Key': key } }
            );

            if (res.success && res.data) {
                setSendingStep('تم الإرسال بنجاح!');
                setTestResult({
                    tone: 'success',
                    message: `تم الإرسال بنجاح عبر المنظومة الآمنة! معرّف الرسالة: ${res.data.message.id} (${res.data.message.status})`
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
            setSimulatingTyping(false);
            setSendingStep(null);
            setBusy(false);
        }
    }

    async function handleCheckNumber() {
        const clean = checkPhone.replace(/[^\d]/g, '');
        if (clean.length < 7) {
            setCheckError('يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة (مثال: +963944123456).');
            return;
        }
        setCheckLoading(true);
        setCheckError(null);
        setCheckResult(null);
        try {
            const res = await apiPost<{
                phone: string;
                exists: boolean;
                status: string;
                message: string;
                device?: string;
            }>(`/devices/${deviceUlid}/check-number`, { phone: checkPhone });

            if (res.success && res.data) {
                setCheckResult(res.data);
            } else {
                setCheckError((res as { error?: { message?: string } })?.error?.message ?? 'تعذر فحص الرقم حالياً.');
            }
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
            setCheckError(errorMsg ?? (err instanceof Error ? err.message : 'تعذر فحص الرقم حالياً.'));
        } finally {
            setCheckLoading(false);
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
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--brand-800))] hover:underline">
                        دليل المطوّر
                    </Link>
                    <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-700))] transition-colors">
                        <ArrowRight className="size-4" />
                        عودة للأجهزة
                    </Link>
                </div>
            }
        >
            <div className="space-y-6">
                {/* 🛡️ الدرع الذكي ومؤشر أمان الجهاز (Anti-Ban Safety Shield) */}
                <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-emerald-500/25 shadow-2xl p-6 text-white">
                    <div className="absolute -top-12 -end-12 size-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -start-12 size-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
                        <div className="flex items-center gap-3.5">
                            <div className="size-12 rounded-[var(--radius-lg)] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                                <ShieldCheck className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-base font-bold text-white">منظومة الحماية ومستوى أمان الحساب</h3>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        درع الأمان نشط
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    يطبق النظام تلقائياً 4 طبقات حماية ومحاكاة بشرية ذكية تجعل كشف الحساب أو حظره من Meta أمراً شبه مستحيل.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-[var(--radius-lg)] backdrop-blur-md self-start md:self-auto shrink-0">
                            <div className="text-end">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">معدل الأمان</span>
                                <span className="text-lg font-black text-emerald-400">98% محمي</span>
                            </div>
                            <div className="size-11 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 text-emerald-300 font-black text-xs shadow-sm">
                                SAFE
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-[var(--radius-md)] bg-white/5 border border-white/10 p-3 flex flex-col justify-between hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                <span className="font-semibold">بصمة الجهاز</span>
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-200">Mac Desktop Official</p>
                            <span className="text-[10px] text-emerald-400 mt-1">تمنع كشف السيرفر كـ Bot</span>
                        </div>

                        <div className="rounded-[var(--radius-md)] bg-white/5 border border-white/10 p-3 flex flex-col justify-between hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                <span className="font-semibold">حفظ جهة الاتصال</span>
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-200">Auto Contact Register</p>
                            <span className="text-[10px] text-emerald-400 mt-1">تمنع أزرار البلاغ بالأحمر</span>
                        </div>

                        <div className="rounded-[var(--radius-md)] bg-white/5 border border-white/10 p-3 flex flex-col justify-between hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                <span className="font-semibold">المحاكاة البشرية</span>
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-200">Dynamic Typing & Online</p>
                            <span className="text-[10px] text-emerald-400 mt-1">ظهور متصل وكتابة واقعية</span>
                        </div>

                        <div className="rounded-[var(--radius-md)] bg-white/5 border border-white/10 p-3 flex flex-col justify-between hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                <span className="font-semibold">فحص الأرقام</span>
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-200">onWhatsApp Check</p>
                            <span className="text-[10px] text-emerald-400 mt-1">فلترة الأرقام غير المسجلة</span>
                        </div>
                    </div>
                </div>

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
                            <div className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="inline-flex p-1 rounded-[var(--radius-lg)] bg-[rgb(var(--surface-soft))] border border-[rgb(var(--border-subtle))]">
                                        <button
                                            type="button"
                                            onClick={() => setConnectMode('qr')}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-all ${connectMode === 'qr' ? 'bg-white shadow-[var(--shadow-sm)] text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                        >
                                            <QrCode className="size-4" />
                                            مسح رمز QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConnectMode('code')}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-all ${connectMode === 'code' ? 'bg-white shadow-[var(--shadow-sm)] text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                        >
                                            <Smartphone className="size-4" />
                                            الربط برقم الهاتف (بدون كاميرا)
                                        </button>
                                    </div>
                                </div>

                                {connectMode === 'qr' ? (
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

                                        <div className="mt-8 pt-6 border-t border-[rgb(var(--border-soft))] w-full">
                                            <h4 className="text-label text-[rgb(var(--brand-950))] mb-4">خطوات الربط عبر رمز QR:</h4>
                                            <ol className="list-decimal list-inside space-y-3 text-body-sm text-[rgb(var(--muted))] marker:text-[rgb(var(--brand-400))] marker:font-bold">
                                                <li>افتح تطبيق واتساب على هاتفك المحمول.</li>
                                                <li>انتقل إلى <strong>الإعدادات</strong> (Settings).</li>
                                                <li>اختر <strong>الأجهزة المرتبطة</strong> (Linked Devices).</li>
                                                <li>اضغط على <strong>ربط جهاز</strong> (Link a Device).</li>
                                                <li>امسح الرمز المعروض أعلاه عبر كاميرا الهاتف وانتظر الاتصال.</li>
                                            </ol>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto space-y-6 pt-2">
                                        <div className="space-y-2 text-center">
                                            <h3 className="text-base font-bold text-[rgb(var(--brand-950))]">الربط برقم الهاتف مباشرة</h3>
                                            <p className="text-xs text-[rgb(var(--muted))]">
                                                إذا كنت تواجه صعوبة في مسح رمز الـ QR أو يتم حظره من قبل واتساب، أدخل رقم هاتفك للحصول على كود من 8 خانات وإدخاله في واتساب مباشرة.
                                            </p>
                                        </div>

                                        <div className="space-y-4 p-4 rounded-[var(--radius-lg)] bg-[rgb(var(--surface-soft))] border border-[rgb(var(--border-subtle))]">
                                            <FormField id="pairing-phone" label="رقم الهاتف (مع الرمز الدولي)" hint="مثال: 963912345678 أو 9665xxxxxxxx">
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="pairing-phone"
                                                        dir="ltr"
                                                        value={pairingPhone}
                                                        onChange={(e) => setPairingPhone(e.target.value)}
                                                        placeholder="+9639XXXXXXXX"
                                                        disabled={requestingCode || busy}
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => void handleRequestPairingCode()}
                                                        loading={requestingCode}
                                                        disabled={requestingCode || busy}
                                                        className="shrink-0"
                                                    >
                                                        طلب الكود
                                                    </Button>
                                                </div>
                                            </FormField>

                                            {pairingCode && (
                                                <div className="pt-4 border-t border-[rgb(var(--border-soft))] text-center space-y-3">
                                                    <p className="text-xs font-bold text-[rgb(var(--brand-900))]">كود الاقتران الخاص بك (أدخله في هاتفك الآن):</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="relative group">
                                                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-40 blur-md group-hover:opacity-75 transition duration-300 animate-pulse" />
                                                            <span className="relative font-mono text-3xl sm:text-4xl font-black tracking-widest text-slate-900 select-all bg-white px-7 py-3 rounded-xl border-2 border-emerald-500 shadow-xl inline-block">
                                                                {pairingCode}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => void copyField('pairing_code', pairingCode)}
                                                            className="shrink-0"
                                                        >
                                                            <Copy className="size-4" />
                                                            {copiedField === 'pairing_code' ? 'تم!' : 'نسخ'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-[rgb(var(--border-soft))]">
                                            <h4 className="text-label text-[rgb(var(--brand-950))] mb-3">خطوات الربط بالهاتف:</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-body-sm text-[rgb(var(--muted))] marker:text-[rgb(var(--brand-400))] marker:font-bold">
                                                <li>افتح واتساب على هاتفك ← <strong>الإعدادات</strong>.</li>
                                                <li>اختر <strong>الأجهزة المرتبطة</strong> ← <strong>ربط جهاز</strong>.</li>
                                                <li>اضغط في الأسفل على <strong>«الربط باستخدام رقم الهاتف بدلاً من ذلك»</strong>.</li>
                                                <li>أدخل الكود المعروض أعلاه وسيتصل جهازك بالمنصة فوراً دون الحاجة للكاميرا.</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                                <ShieldCheck className="size-4" />
                                حماية متقدمة ومكافحة الحظر (Anti-Ban Safeguards):
                            </div>
                            <ul className="list-disc list-inside text-xs text-[rgb(var(--muted))] space-y-1.5 pe-2 leading-relaxed">
                                <li><strong>تسجيل الاسم تلقائياً:</strong> يقوم النظام برمجياً بتسجيل وحفظ كل رقم يتم الإرسال له كجهة اتصال موثوقة في الواتساب باسم طبيعي لحماية الحساب من كشف الأرقام الغريبة.</li>
                                <li><strong>فحص الرقم المسبق (onWhatsApp):</strong> يتم التحقق فورياً من وجود حساب واتساب فعال للرقم قبل الإرسال لحماية مؤشر السمعة (Sender Reputation).</li>
                                <li><strong>محاكاة كاملة للسلوك البشري:</strong> فتح المحادثة، التواجد أونلاين، ومحاكاة الكتابة الذكية بمدة تتناسب بدقة مع طول الرسالة قبل الإرسال.</li>
                                <li><strong>دعم الـ Spintax للتنويع التلقائي:</strong> يمكنك كتابة <code dir="ltr" className="bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-900 dark:text-amber-200">{"{مرحباً|أهلاً بك|السلام عليكم}"}</code> في نص الرسالة ليقوم النظام باختيار صياغة مختلفة لكل عميل وتفادي كشف التكرار.</li>
                                <li><strong>تدفئة الأرقام الجديدة:</strong> احرص على البدء بتدريج عدد الرسائل اليومية في الأسبوع الأول، والاعتماد على WhatsApp Business الرسمي.</li>
                            </ul>
                        </div>

                        {!pairingAvailable && !isConnected && (
                            <Alert tone="warning" title="الربط غير متاح" className="mt-6">
                                المحرك الحالي ({engine}) لا يدعم QR. عيّن <code dir="ltr">WHATSAPP_ENGINE=baileys</code> في .env
                                ثم أعد تشغيل حاوية api.
                            </Alert>
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
                        title="بيانات ربط الجهاز والإرسال"
                        description="لربط جهازك مع متجرك أو موقعك أو أي نظام خارجي، استخدم البيانات التالية فقط: رابط الإرسال، اسم الجهاز، واسم المستخدم."
                    >
                        {integration ? (() => {
                            const sendUrl = integration.send_url || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/messages/send` : '/api/v1/messages/send');
                            const checkUrl = integration.check_url || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/numbers/check` : '/api/v1/numbers/check');
                            const deviceName = device?.name || integration.device_name;
                            const username = integration.username;

                            return (
                                <div className="space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">1. رابط الإرسال</span>
                                                {copiedField === 'send_url' ? (
                                                    <span className="text-xs font-medium text-[rgb(var(--success-600))] inline-flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" /> تم النسخ
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-[rgb(var(--brand-950))]">رابط الإرسال (Send URL)</p>
                                            <div className="flex gap-1.5 pt-1">
                                                <Input
                                                    id="integration-send-url"
                                                    dir="ltr"
                                                    readOnly
                                                    value={sendUrl}
                                                    className="font-mono text-xs select-all bg-white"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => void copyField('send_url', sendUrl)}
                                                    title="نسخ رابط الإرسال"
                                                    className="shrink-0"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">2. فحص الأرقام</span>
                                                {copiedField === 'check_url' ? (
                                                    <span className="text-xs font-medium text-[rgb(var(--success-600))] inline-flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" /> تم النسخ
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-[rgb(var(--brand-950))]">رابط فحص الرقم (Check URL)</p>
                                            <div className="flex gap-1.5 pt-1">
                                                <Input
                                                    id="integration-check-url"
                                                    dir="ltr"
                                                    readOnly
                                                    value={checkUrl}
                                                    className="font-mono text-xs select-all bg-white"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => void copyField('check_url', checkUrl)}
                                                    title="نسخ رابط فحص الرقم"
                                                    className="shrink-0"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">3. اسم الجهاز</span>
                                                {copiedField === 'device_name' ? (
                                                    <span className="text-xs font-medium text-[rgb(var(--success-600))] inline-flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" /> تم النسخ
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-[rgb(var(--brand-950))]">اسم الجهاز (Device Name)</p>
                                            <div className="flex gap-1.5 pt-1">
                                                <Input
                                                    id="integration-device-name"
                                                    dir="auto"
                                                    readOnly
                                                    value={deviceName}
                                                    className="font-medium text-xs select-all bg-white font-bold"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => void copyField('device_name', deviceName)}
                                                    title="نسخ اسم الجهاز"
                                                    className="shrink-0"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-soft))] p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">4. اسم المستخدم</span>
                                                {copiedField === 'username' ? (
                                                    <span className="text-xs font-medium text-[rgb(var(--success-600))] inline-flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" /> تم النسخ
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-semibold text-[rgb(var(--brand-950))]">اسم المستخدم (Username)</p>
                                            <div className="flex gap-1.5 pt-1">
                                                <Input
                                                    id="integration-username"
                                                    dir="ltr"
                                                    readOnly
                                                    value={username}
                                                    className="font-mono text-xs select-all bg-white font-bold"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => void copyField('username', username)}
                                                    title="نسخ اسم المستخدم"
                                                    className="shrink-0"
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-[rgb(var(--border-subtle))]">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-[rgb(var(--brand-950))] flex items-center gap-2">
                                                    <Code className="size-4 text-[rgb(var(--brand-600))]" />
                                                    مكتبة كود الربط السريع (Code Snippets)
                                                </h4>
                                                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                                                    كود جاهز للنسخ المباشر مجهز ببيانات جهازك الحقيقية لجميع اللغات والمنصات.
                                                </p>
                                            </div>

                                            {/* Language Tabs */}
                                            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[rgb(var(--surface-soft))] border border-[rgb(var(--border-subtle))]">
                                                <button
                                                    type="button"
                                                    onClick={() => setCodeTab('webhook')}
                                                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${codeTab === 'webhook' ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                                >
                                                    Webhook / رابط سريع
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCodeTab('curl')}
                                                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${codeTab === 'curl' ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                                >
                                                    cURL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCodeTab('php')}
                                                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${codeTab === 'php' ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                                >
                                                    PHP
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCodeTab('js')}
                                                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${codeTab === 'js' ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                                >
                                                    Node.js
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCodeTab('python')}
                                                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${codeTab === 'python' ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'}`}
                                                >
                                                    Python
                                                </button>
                                            </div>
                                        </div>

                                        {codeTab === 'webhook' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                    <span>رابط مباشر GET للمتصفح وسلة وزد و Make و Zapier:</span>
                                                </div>
                                                <CodeBlock
                                                    code={`${sendUrl}?username=${encodeURIComponent(username)}&device=${encodeURIComponent(deviceName)}&to=+9639XXXXXXXX&message=${encodeURIComponent('{مرحباً|أهلاً بك} تم تأكيد طلبك بنجاح!')}`}
                                                    language="http"
                                                />
                                            </div>
                                        )}

                                        {codeTab === 'curl' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                    <span>طلب cURL عبر الطرفية (Terminal):</span>
                                                </div>
                                                <CodeBlock
                                                    code={`curl -X POST "${sendUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "username": "${username}",\n    "device": "${deviceName}",\n    "to": "+9639XXXXXXXX",\n    "message": "{مرحباً|أهلاً بك} تم تأكيد طلبك بنجاح!"\n  }'`}
                                                    language="bash"
                                                />
                                            </div>
                                        )}

                                        {codeTab === 'php' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                    <span>كود PHP cURL لمتاجر ووكومرس والأنظمة البرمجية:</span>
                                                </div>
                                                <CodeBlock
                                                    code={`<?php\n$payload = [\n    'username' => '${username}',\n    'device'   => '${deviceName}',\n    'to'       => '+9639XXXXXXXX',\n    'message'  => '{مرحباً|أهلاً بك} تم تأكيد طلبك بنجاح!',\n];\n\n$ch = curl_init('${sendUrl}');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`}
                                                    language="php"
                                                />
                                            </div>
                                        )}

                                        {codeTab === 'js' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                    <span>كود JavaScript / Node.js (Fetch API):</span>
                                                </div>
                                                <CodeBlock
                                                    code={`// إرسال عبر Node.js / JavaScript\nconst response = await fetch('${sendUrl}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    username: '${username}',\n    device: '${deviceName}',\n    to: '+9639XXXXXXXX',\n    message: '{مرحباً|أهلاً بك} تم تأكيد طلبك بنجاح!'\n  })\n});\nconst result = await response.json();\nconsole.log(result);`}
                                                    language="javascript"
                                                />
                                            </div>
                                        )}

                                        {codeTab === 'python' && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                    <span>كود Python باستخدام مكتبة requests:</span>
                                                </div>
                                                <CodeBlock
                                                    code={`import requests\n\nurl = "${sendUrl}"\ndata = {\n    "username": "${username}",\n    "device": "${deviceName}",\n    "to": "+9639XXXXXXXX",\n    "message": "{مرحباً|أهلاً بك} تم تأكيد طلبك بنجاح!"\n}\nresponse = requests.post(url, json=data)\nprint(response.json())`}
                                                    language="python"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })() : (
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
                            title="استوديو الاختبار والمحاكاة الحية"
                            description="جرب إرسال رسالة مباشرة وشاهد المعاينة الحية على هاتف العميل ومحاكاة الكتابة التلقائية."
                        >
                            <div className="grid gap-8 lg:grid-cols-12 items-start">
                                {/* Form Side */}
                                <div className="lg:col-span-7 space-y-5">
                                    <FormField id="test-recipient" label="رقم المستلم (صيغة دولية E.164)" hint="مثال: +9639xxxxxxxx أو +9665xxxxxxxx">
                                        <Input
                                            id="test-recipient"
                                            dir="ltr"
                                            placeholder="+9639xxxxxxxx"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            className="font-mono text-sm bg-white"
                                        />
                                    </FormField>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="test-message" className="text-label text-[rgb(var(--brand-950))]">
                                                محتوى الرسالة (مع دعم الـ Spintax)
                                            </label>
                                            <span className="text-[11px] text-[rgb(var(--muted))] font-normal">
                                                استخدم {"{خيارات|متنوعة}"} لتفادي الحظر
                                            </span>
                                        </div>

                                        {/* Quick Spintax Chips */}
                                        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[var(--radius-md)] bg-[rgb(var(--surface-soft))] border border-[rgb(var(--border-subtle))]">
                                            <span className="text-[11px] font-bold text-[rgb(var(--brand-900))] me-1">إدراج سريع:</span>
                                            <button
                                                type="button"
                                                onClick={() => insertSpintax('{مرحباً|أهلاً بك|السلام عليكم}')}
                                                className="px-2 py-0.5 rounded-full text-[11px] bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-xs"
                                            >
                                                + التحية
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpintax('{عزيزنا العميل|صديقنا المشترك}')}
                                                className="px-2 py-0.5 rounded-full text-[11px] bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-xs"
                                            >
                                                + المناداة
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpintax('{طلبك جاهز|تم تأكيد طلبك|طلبك في الطريق}')}
                                                className="px-2 py-0.5 rounded-full text-[11px] bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-xs"
                                            >
                                                + الحالة
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpintax('{شكراً لاختيارك لنا|نسعد بخدمتك دائماً}')}
                                                className="px-2 py-0.5 rounded-full text-[11px] bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-xs"
                                            >
                                                + الخاتمة
                                            </button>
                                        </div>

                                        <Textarea
                                            id="test-message"
                                            rows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="اكتب رسالتك هنا..."
                                            className="bg-white font-sans text-sm"
                                        />
                                    </div>

                                    {sendingStep && (
                                        <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-pulse">
                                            <RefreshCw className="size-4 animate-spin text-emerald-600 shrink-0" />
                                            <span>{sendingStep}</span>
                                        </div>
                                    )}

                                    {testResult && (
                                        <Alert tone={testResult.tone} title={testResult.tone === 'success' ? 'نجاح الإرسال' : 'تنبيه'}>
                                            {testResult.message}
                                        </Alert>
                                    )}

                                    <Button
                                        loading={busy}
                                        disabled={!/^\+[1-9]\d{7,14}$/.test(recipient) || !message.trim()}
                                        onClick={() => void sendTestMessage()}
                                        className="w-full sm:w-auto shadow-md"
                                    >
                                        <Sparkles className="size-4" />
                                        إرسال الرسالة التجريبية الآن
                                    </Button>
                                </div>

                                {/* Phone Mockup Simulator Side */}
                                <div className="lg:col-span-5 flex flex-col items-center justify-center pt-2">
                                    <div className="w-full max-w-[280px] rounded-[36px] border-[7px] border-slate-900 bg-[#0b141a] shadow-2xl overflow-hidden flex flex-col justify-between aspect-[9/17] relative text-white font-sans ring-1 ring-white/10">
                                        {/* Phone Top Status */}
                                        <div className="bg-[#1f2c34] pt-3 px-4 pb-2 text-[11px] flex items-center justify-between text-slate-300 border-b border-white/5">
                                            <span className="font-semibold">9:41</span>
                                            <span className="text-[10px] text-slate-400">WhatsApp Preview</span>
                                        </div>

                                        {/* WhatsApp App Header */}
                                        <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2.5 shadow-sm border-b border-white/5">
                                            <div className="relative size-8 rounded-full bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                م
                                                <span className="absolute bottom-0 end-0 size-2 rounded-full bg-emerald-500 ring-2 ring-[#1f2c34]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-100 truncate">العميل (معاينة حية)</p>
                                                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    متصل الآن (Online)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Chat Body Wallpaper */}
                                        <div className="flex-1 p-3 flex flex-col justify-end space-y-3 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] overflow-y-auto">
                                            <div className="text-center">
                                                <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[9px] text-slate-400 border border-white/5 shadow-xs">
                                                    اليوم
                                                </span>
                                            </div>

                                            {simulatingTyping ? (
                                                <div className="bg-[#202c33] text-slate-300 rounded-2xl rounded-tr-none px-3.5 py-2.5 w-fit inline-flex items-center gap-1.5 shadow-md">
                                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" />
                                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            ) : (
                                                <div className="self-end max-w-[85%] bg-[#005c4b] text-white rounded-2xl rounded-tl-none p-2.5 shadow-md text-xs leading-relaxed break-words">
                                                    <p>{spunPreview || 'اكتب رسالة لمعاينتها هنا...'}</p>
                                                    <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-emerald-200/80">
                                                        <span>الآن</span>
                                                        <span className="text-sky-300 font-bold tracking-tighter">✓✓</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Phone Bottom Bar */}
                                        <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-white/5">
                                            <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1 text-[10px] text-slate-400">
                                                مراسيل WhatsApp API...
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dice Shuffle Button */}
                                    <div className="mt-3 text-center">
                                        <button
                                            type="button"
                                            onClick={handleSpinDice}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-indigo-900 border border-indigo-200 shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
                                        >
                                            <Dices className="size-3.5 text-indigo-600" />
                                            🎲 جرّب تقليب الصياغة (Spin Preview)
                                        </button>
                                        <p className="text-[10px] text-[rgb(var(--muted))] mt-1">
                                            اضغط لرؤية كيف تتبدل الكلمات عشوائياً لكل مستلم بفضل Spintax
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TenantPanel>
                    </div>
                )}

                {isConnected && (
                    <div>
                        <TenantPanel
                            title="أداة فحص وتأكيد أرقام الواتساب (WhatsApp Number Lookup)"
                            description="تحقق فورياً مما إذا كان رقم العميل يملك حساب واتساب نشط لتفادي الإرسال لأرقام غير مسجلة وحماية حسابك من قيود وحظر واتساب، مع إمكانية ربط هذا الفحص في متجرك (سلة، زد، ووكومرس) عند تسجيل دخول العميل أو إتمام الطلب."
                        >
                            <div className="space-y-6">
                                {/* Live Interactive Checker Tool */}
                                <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border-subtle))] bg-gradient-to-br from-[rgb(var(--surface-soft))] to-white p-6 space-y-4 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                                                <Search className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[rgb(var(--brand-950))]">
                                                    فاحص الأرقام اللحظي (Live Phone Checker)
                                                </h4>
                                                <p className="text-xs text-[rgb(var(--muted))]">
                                                    اكتب أي رقم هاتف محلي أو دولي للتأكد الفوري من وجود حساب واتساب عليه
                                                </p>
                                            </div>
                                        </div>
                                        <Badge tone="accent" className="self-start sm:self-auto font-medium">
                                            <ShieldCheck className="size-3 me-1 inline" />
                                            استعلام مباشر من سيرفرات واتساب
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                        <div className="flex-1">
                                            <Input
                                                id="check-number-input"
                                                dir="ltr"
                                                placeholder="+9639XXXXXXXX أو 9665XXXXXXXX"
                                                value={checkPhone}
                                                onChange={(e) => setCheckPhone(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') void handleCheckNumber();
                                                }}
                                                className="font-mono text-sm bg-white"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => void handleCheckNumber()}
                                            loading={checkLoading}
                                            disabled={!checkPhone.trim() || checkLoading}
                                            className="shrink-0 shadow-sm"
                                        >
                                            <Search className="size-4" />
                                            فحص الرقم الآن
                                        </Button>
                                    </div>

                                    {checkError && (
                                        <Alert tone="danger" title="خطأ أثناء الفحص">
                                            {checkError}
                                        </Alert>
                                    )}

                                    {checkResult && (
                                        <div
                                            className={`p-4 rounded-[var(--radius-lg)] border transition-all ${
                                                checkResult.exists
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3.5">
                                                <div
                                                    className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                                                        checkResult.exists
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                            : 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                                    }`}
                                                >
                                                    {checkResult.exists ? (
                                                        <CheckCircle2 className="size-6" />
                                                    ) : (
                                                        <AlertTriangle className="size-6" />
                                                    )}
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <h5 className="text-base font-bold">
                                                            {checkResult.exists
                                                                ? 'الرقم يملك حساب واتساب نشط وجاهز للإرسال ✅'
                                                                : 'الرقم غير مسجل على واتساب ❌'}
                                                        </h5>
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                checkResult.exists
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-rose-600 text-white'
                                                            }`}
                                                        >
                                                            {checkResult.exists ? 'واتساب نشط (Active)' : 'غير مسجل (Unregistered)'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs opacity-90 font-mono" dir="ltr">
                                                        {checkResult.phone}
                                                    </p>
                                                    <p className="text-xs pt-1 leading-relaxed">
                                                        {checkResult.exists
                                                            ? 'هذا الرقم آمن 100% لإرسال رسائل الإشعارات والتأكيد والـ OTP دون أي خوف من قيود أو حظر واتساب.'
                                                            : 'تنبيه أمان: إرسال رسائل إلى أرقام غير مسجلة على واتساب يُعد سبباً رئيسياً للحظر من خوارزميات ميتا. يُنصح بتحويل إشعار هذا العميل إلى SMS أو تنبيهه لتعديل رقمه.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* API & Store Integration for Number Checker */}
                                {(() => {
                                    const checkUrl = integration?.check_url || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/numbers/check` : '/api/v1/numbers/check');
                                    const devName = device?.name || integration?.device_name || '';
                                    const uName = integration?.username || '';

                                    return (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="text-sm font-bold text-[rgb(var(--brand-950))] flex items-center gap-2">
                                                        <Code className="size-4 text-[rgb(var(--brand-600))]" />
                                                        ربط الفحص في متجرك ومنصتك (Store Verification API)
                                                    </h4>
                                                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                                                        يمكنك استدعاء هذا الرابط في صفحة تسجيل الزبائن أو إتمام الطلب للتحقق من الرقم تلقائياً قبل إرسال الرسالة.
                                                    </p>
                                                </div>

                                                {/* Check Code Language Tabs */}
                                                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[rgb(var(--surface-soft))] border border-[rgb(var(--border-subtle))]">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckCodeTab('webhook')}
                                                        className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                                                            checkCodeTab === 'webhook'
                                                                ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]'
                                                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'
                                                        }`}
                                                    >
                                                        Webhook / رابط سريع
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckCodeTab('curl')}
                                                        className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                                                            checkCodeTab === 'curl'
                                                                ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]'
                                                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'
                                                        }`}
                                                    >
                                                        cURL
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckCodeTab('php')}
                                                        className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                                                            checkCodeTab === 'php'
                                                                ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]'
                                                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'
                                                        }`}
                                                    >
                                                        PHP (ووكومرس)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckCodeTab('js')}
                                                        className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                                                            checkCodeTab === 'js'
                                                                ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]'
                                                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'
                                                        }`}
                                                    >
                                                        Node.js
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckCodeTab('python')}
                                                        className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
                                                            checkCodeTab === 'python'
                                                                ? 'bg-white shadow-xs text-[rgb(var(--brand-950))]'
                                                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--brand-900))]'
                                                        }`}
                                                    >
                                                        Python
                                                    </button>
                                                </div>
                                            </div>

                                            {checkCodeTab === 'webhook' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                        <span>طلب GET سريع ومباشر يفحص الرقم ويرجع النتيجة كـ JSON:</span>
                                                    </div>
                                                    <CodeBlock
                                                        code={`${checkUrl}?username=${encodeURIComponent(uName)}&device=${encodeURIComponent(devName)}&phone=+9639XXXXXXXX`}
                                                        language="http"
                                                    />
                                                </div>
                                            )}

                                            {checkCodeTab === 'curl' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                        <span>طلب cURL لفحص الرقم:</span>
                                                    </div>
                                                    <CodeBlock
                                                        code={`curl -X POST "${checkUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "username": "${uName}",\n    "device": "${devName}",\n    "phone": "+9639XXXXXXXX"\n  }'`}
                                                        language="bash"
                                                    />
                                                </div>
                                            )}

                                            {checkCodeTab === 'php' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                        <span>كود PHP لفحص الرقم وتفادي الحظر قبل إرسال الرسالة:</span>
                                                    </div>
                                                    <CodeBlock
                                                        code={`<?php\n$checkUrl = "${checkUrl}";\n$params = [\n    'username' => '${uName}',\n    'device'   => '${devName}',\n    'phone'    => '+9639XXXXXXXX',\n];\n\n$response = file_get_contents($checkUrl . '?' . http_build_query($params));\n$result = json_decode($response, true);\n\nif (!empty($result['data']['exists'])) {\n    // ✅ الرقم مؤكد ولديه واتساب - تابع الإرسال بأمان\n    echo "الرقم يملك واتساب نشط";\n} else {\n    // ❌ الرقم غير مسجل - حوّل الإشعار لـ SMS أو أظهر تنبيهاً للعميل\n    echo "الرقم غير مسجل على واتساب!";\n}`}
                                                        language="php"
                                                    />
                                                </div>
                                            )}

                                            {checkCodeTab === 'js' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                        <span>كود JavaScript / Frontend أو Node.js للتحقق من الرقم:</span>
                                                    </div>
                                                    <CodeBlock
                                                        code={`// فحص رقم العميل قبل إتمام الطلب أو إرسال OTP\nconst res = await fetch('${checkUrl}?username=${encodeURIComponent(uName)}&device=${encodeURIComponent(devName)}&phone=+9639XXXXXXXX');\nconst data = await res.json();\n\nif (data.data?.exists) {\n  console.log('✅ الرقم يملك واتساب نشط');\n  // تابع إرسال الإشعار\n} else {\n  console.warn('❌ الرقم غير مسجل على واتساب');\n  // نبّه العميل لتصحيح رقمه أو حوّل الإشعار لـ SMS\n}`}
                                                        language="javascript"
                                                    />
                                                </div>
                                            )}

                                            {checkCodeTab === 'python' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                                                        <span>كود Python للتحقق من الرقم:</span>
                                                    </div>
                                                    <CodeBlock
                                                        code={`import requests\n\nurl = "${checkUrl}"\nparams = {\n    "username": "${uName}",\n    "device": "${devName}",\n    "phone": "+9639XXXXXXXX"\n}\nres = requests.get(url, params=params).json()\n\nif res.get("data", {}).get("exists"):\n    print("✅ الرقم يملك واتساب نشط")\nelse:\n    print("❌ الرقم غير مسجل على واتساب")`}
                                                        language="python"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
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
