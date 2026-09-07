import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, ImagePlus, LogOut, PowerOff, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import { io, type Socket } from 'socket.io-client';
import AdminShell from '@/Layouts/AdminShell';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { adminDelete, adminGet, adminPatch, adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n/useI18n';

type PlatformDevice = {
    id: string;
    name: string;
    display_name: string | null;
    phone_e164: string | null;
    status: string;
    avatar_url: string | null;
    is_platform: boolean;
    last_connected_at: string | null;
    last_error_code: string | null;
};

type PairingPayload = {
    qr: string;
    expires_in: number;
};

type PageProps = {
    device: PlatformDevice | null;
    isReady: boolean;
    engine: string;
    pairingAvailable: boolean;
    engineStatus?: string | null;
};

const STATUS_KEYS: Record<string, string> = {
    pending: 'platform.status.pending',
    starting: 'platform.status.starting',
    waiting_for_qr: 'platform.status.waiting_for_qr',
    qr_required: 'platform.status.qr_required',
    pairing: 'platform.status.pairing',
    connecting: 'platform.status.connecting',
    connected: 'platform.status.connected',
    disconnected: 'platform.status.disconnected',
    reconnecting: 'platform.status.reconnecting',
    logged_out: 'platform.status.logged_out',
    failed: 'platform.status.failed',
    error: 'platform.status.error',
};

export default function PlatformWhatsAppIndex({ device: initialDevice, isReady, engine, pairingAvailable, engineStatus: initialEngineStatus }: PageProps) {
    const { t } = useI18n();
    const [device, setDevice] = useState<PlatformDevice | null>(initialDevice);
    const [engineStatus, setEngineStatus] = useState<string | null>(initialEngineStatus ?? null);
    const [ready, setReady] = useState(isReady);
    const [displayName, setDisplayName] = useState(initialDevice?.display_name ?? 'Marasil');
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [qrSeconds, setQrSeconds] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<'disconnect' | 'logout' | 'delete' | null>(null);
    const pairingRequested = useRef(false);
    const lastQr = useRef<string | null>(null);
    const tRef = useRef(t);
    const deviceIdRef = useRef(device?.id);
    tRef.current = t;
    deviceIdRef.current = device?.id;
    const deviceId = device?.id;
    const deviceStatus = device?.status;
    const isDeviceConnected = deviceStatus === 'connected' && engineStatus === 'connected';
    const shouldListen = Boolean(deviceId && pairingAvailable && !isDeviceConnected);

    const statusLabel = (status: string) => {
        const key = STATUS_KEYS[status];
        return key ? t(key) : status;
    };

    const applyQr = useCallback(async (payload: PairingPayload) => {
        if (!payload.qr) {
            return;
        }

        if (lastQr.current === payload.qr) {
            setQrSeconds(Math.max(1, payload.expires_in));
            return;
        }

        try {
            const img = await QRCode.toDataURL(payload.qr, { width: 280, margin: 2 });
            lastQr.current = payload.qr;
            setQrImage(img);
            setQrSeconds(Math.max(1, payload.expires_in));
            setError(null);
        } catch {
            setError(tRef.current('platform.connectError'));
        }
    }, []);

    const refresh = useCallback(async () => {
        const res = await adminGet<{ device: PlatformDevice | null; is_ready: boolean; pairing?: PairingPayload | null; engine_status?: string | null }>('/platform-whatsapp');
        if (res.success && res.data) {
            setDevice(res.data.device);
            setReady(res.data.is_ready);
            setEngineStatus(res.data.engine_status ?? null);
            if (res.data.device?.display_name) {
                setDisplayName(res.data.device.display_name);
            }
            if (res.data.pairing?.qr) {
                void applyQr(res.data.pairing);
            }
        }
    }, [applyQr]);

    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;

    useEffect(() => {
        if (!deviceId || isDeviceConnected) {
            return;
        }

        const interval = window.setInterval(() => {
            void refreshRef.current();
        }, 5000);

        return () => window.clearInterval(interval);
    }, [deviceId, isDeviceConnected]);

    useEffect(() => {
        if (qrSeconds <= 0) {
            if (qrSeconds === 0) {
                lastQr.current = null;
                setQrImage(null);
            }
            return;
        }

        const timer = window.setTimeout(() => setQrSeconds((seconds) => seconds - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [qrSeconds]);

    const connect = useCallback(async () => {
        setBusy(true);
        setError(null);
        lastQr.current = null;
        setQrImage(null);
        setQrSeconds(0);
        try {
            if (!deviceIdRef.current) {
                const setupRes = await adminPost<{ device: PlatformDevice }>('/platform-whatsapp/setup');
                if (!setupRes.success || !setupRes.data?.device) {
                    throw new Error('setup failed');
                }
                setDevice(setupRes.data.device);
                setSuccess(tRef.current('platform.setupSuccess'));
            }
            const res = await adminPost<{ device: PlatformDevice }>('/platform-whatsapp/connect');
            if (res.success && res.data?.device) {
                setDevice(res.data.device);
            }
        } catch {
            setError(tRef.current('platform.connectError'));
        } finally {
            setBusy(false);
        }
    }, []);

    const connectRef = useRef(connect);
    connectRef.current = connect;

    const saveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const res = await adminPatch<{ device: PlatformDevice }>('/platform-whatsapp', { display_name: displayName });
            if (res.success && res.data?.device) {
                setDevice(res.data.device);
                setSuccess(t('platform.profileSaved'));
            }
        } catch {
            setError(t('common.error'));
        } finally {
            setBusy(false);
        }
    };

    const uploadAvatar = async (file: File) => {
        const form = new FormData();
        form.append('avatar', file);
        setBusy(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/v1/platform-whatsapp/avatar', {
                method: 'POST',
                body: form,
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });
            const json = await res.json();
            if (json.success && json.data?.device) {
                setDevice(json.data.device);
                setSuccess(t('platform.avatarSaved'));
                router.reload({ only: ['device'] });
            } else {
                setError(t('common.error'));
            }
        } catch {
            setError(t('common.error'));
        } finally {
            setBusy(false);
        }
    };

    const runAction = async (action: 'disconnect' | 'logout' | 'delete') => {
        setBusy(true);
        setError(null);
        try {
            if (action === 'delete') {
                const deleted = await adminDelete<{ deleted: boolean }>('/platform-whatsapp');
                if (deleted.success) {
                    setDevice(null);
                    setReady(false);
                    lastQr.current = null;
                    setQrImage(null);
                    setQrSeconds(0);
                    setSuccess(t('platform.deleted'));
                }
                return;
            }

            const res = await adminPost<{ device: PlatformDevice }>(`/platform-whatsapp/${action}`);
            if (res.success && res.data?.device) {
                setDevice(res.data.device);
                setReady(false);
                lastQr.current = null;
                setQrImage(null);
                setQrSeconds(0);
            }
        } catch {
            setError(t('common.error'));
        } finally {
            setBusy(false);
            setConfirmAction(null);
        }
    };

    useEffect(() => {
        if (!deviceId) {
            pairingRequested.current = false;
        }
    }, [deviceId]);

    useEffect(() => {
        if (!pairingAvailable || isDeviceConnected || pairingRequested.current) {
            return;
        }

        pairingRequested.current = true;
        void connectRef.current();
    }, [deviceId, isDeviceConnected, pairingAvailable]);

    useEffect(() => {
        if (!shouldListen || !deviceId) {
            return;
        }

        let socket: Socket | null = null;
        let cancelled = false;
        let tokenTimer: number | undefined;

        const fetchToken = async (): Promise<string | null> => {
            const tokenRes = await adminPost<{ token: string }>('/platform-whatsapp/socket-token');
            return tokenRes.success ? tokenRes.data?.token ?? null : null;
        };

        void (async () => {
            const token = await fetchToken();
            if (!token || cancelled) {
                return;
            }

            socket = io(window.location.origin, {
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 8,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 15000,
                auth: { token },
            });

            tokenTimer = window.setInterval(() => {
                void fetchToken().then((fresh) => {
                    if (fresh && socket) {
                        socket.auth = { token: fresh };
                    }
                });
            }, 60_000);

            socket.on('device.qr_ready', (payload: { qr?: string; expires_in?: number }) => {
                if (payload.qr) {
                    void applyQr({ qr: payload.qr, expires_in: payload.expires_in ?? 20 });
                }
            });

            socket.on('device.connected', (payload: { phone_number?: string; display_name?: string }) => {
                lastQr.current = null;
                setQrImage(null);
                setQrSeconds(0);
                setReady(true);
                setEngineStatus('connected');
                setDevice((current) => current ? {
                    ...current,
                    status: 'connected',
                    phone_e164: payload.phone_number
                        ? `+${String(payload.phone_number).replace(/^\+/, '')}`
                        : current.phone_e164,
                    display_name: payload.display_name ?? current.display_name,
                    last_connected_at: new Date().toISOString(),
                } : current);
                setSuccess(tRef.current('platform.connectedSuccess'));
            });

            socket.on('device.logged_out', () => {
                lastQr.current = null;
                setQrImage(null);
                setQrSeconds(0);
                void refreshRef.current();
            });
        })();

        return () => {
            cancelled = true;
            if (tokenTimer !== undefined) {
                window.clearInterval(tokenTimer);
            }
            socket?.disconnect();
        };
    }, [applyQr, deviceId, shouldListen]);

    return (
        <AdminShell title={t('platform.title')}>
            <Head title={t('platform.title')} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{t('platform.title')}</h1>
                    <p className="mt-1 text-sm text-neutral-600">{t('platform.subtitle')}</p>
                </div>

                {error && <Alert tone="danger">{error}</Alert>}
                {success && <Alert tone="success">{success}</Alert>}
                <Alert tone="info">{t('platform.accountSeparation')}</Alert>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Profile & Status */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <label className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary-400">
                                {device?.avatar_url ? (
                                    <img src={device.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <Smartphone className="h-8 w-8 text-neutral-400" />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                    <ImagePlus className="h-5 w-5 text-white" />
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={!device || busy}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) void uploadAvatar(file);
                                    }}
                                />
                            </label>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-semibold">{device?.display_name ?? t('platform.notConfigured')}</h2>
                                    {device && (
                                        <Badge tone={isDeviceConnected ? 'success' : 'neutral'}>
                                            {statusLabel(isDeviceConnected ? 'connected' : device.status)}
                                        </Badge>
                                    )}
                                </div>
                                {device?.phone_e164 && (
                                    <p className="mt-1 text-sm text-neutral-600" dir="ltr">{device.phone_e164}</p>
                                )}
                                <p className="mt-2 text-xs text-neutral-500">
                                    {t('platform.otpStatus')}: {ready ? t('platform.otpReady') : t('platform.otpNotReady')}
                                    {' · '}
                                    {t('platform.engine')}: {engine}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={saveProfile} className="mt-6 space-y-4">
                            <FormField id="platform-display-name" label={t('platform.displayName')}>
                                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!device || busy} />
                            </FormField>
                            <div className="flex flex-wrap gap-2">
                                {!device && (
                                    <Button type="button" onClick={() => void connect()} disabled={busy}>
                                        {t('platform.createAccount')}
                                    </Button>
                                )}
                                {device && !isDeviceConnected && (
                                    <Button type="button" onClick={() => void connect()} disabled={busy}>
                                        <RefreshCw className="h-4 w-4" />
                                        {t('platform.connect')}
                                    </Button>
                                )}
                                {device && (
                                    <Button type="submit" variant="secondary" disabled={busy}>
                                        {t('common.save')}
                                    </Button>
                                )}
                                {device && (
                                    <Button type="button" variant="danger" onClick={() => setConfirmAction('delete')} disabled={busy}>
                                        <Trash2 className="h-4 w-4" />
                                        {t('platform.deleteAccount')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* QR Code */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-neutral-900">{t('platform.qrTitle')}</h3>
                        <p className="mt-1 text-sm text-neutral-600">{t('platform.qrHint')}</p>

                        <div className="mt-6 flex flex-col items-center justify-center">
                            {isDeviceConnected ? (
                                <div className="flex flex-col items-center gap-3 py-8 text-emerald-600">
                                    <CheckCircle2 className="h-16 w-16" />
                                    <p className="font-medium">{t('platform.connectedSuccess')}</p>
                                </div>
                            ) : qrImage ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img src={qrImage} alt="WhatsApp QR" className="rounded-lg border border-neutral-200" />
                                    <p className="text-sm font-medium text-neutral-600">
                                        {t('platform.qrExpiresIn', { seconds: qrSeconds })}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500">
                                    {device
                                        ? t(['pending', 'starting', 'connecting', 'reconnecting'].includes(device.status) ? 'platform.startingPairing' : 'platform.waitingQr')
                                        : t('platform.createFirst')}
                                </div>
                            )}
                        </div>

                        {device && isDeviceConnected && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmAction('disconnect')} disabled={busy}>
                                    <PowerOff className="h-4 w-4" />
                                    {t('platform.disconnect')}
                                </Button>
                                <Button type="button" variant="danger" size="sm" onClick={() => setConfirmAction('logout')} disabled={busy}>
                                    <LogOut className="h-4 w-4" />
                                    {t('platform.logout')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <ConfirmDialog
                open={confirmAction === 'disconnect'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={t('platform.disconnect')}
                description={t('platform.disconnectConfirm')}
                confirmLabel={t('platform.disconnect')}
                onConfirm={() => void runAction('disconnect')}
            />
            <ConfirmDialog
                open={confirmAction === 'logout'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={t('platform.logout')}
                description={t('platform.logoutConfirm')}
                confirmLabel={t('platform.logout')}
                tone="danger"
                onConfirm={() => void runAction('logout')}
            />
            <ConfirmDialog
                open={confirmAction === 'delete'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={t('platform.deleteAccount')}
                description={t('platform.deleteConfirm')}
                confirmLabel={t('platform.deleteAccount')}
                tone="danger"
                onConfirm={() => void runAction('delete')}
            />
        </AdminShell>
    );
}
