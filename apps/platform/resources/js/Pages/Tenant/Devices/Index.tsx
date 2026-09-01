import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Link2, Plus, Smartphone, Trash2 } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { Input } from '@/Components/ui/Input';
import TenantShell from '@/Layouts/TenantShell';
import { apiDelete, apiGet, apiPost } from '@/Lib/api-client';

type Device = {
    id: string;
    name: string;
    status: string;
    phone_e164: string | null;
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'جديد',
    starting: 'جارٍ التجهيز',
    waiting_for_qr: 'بانتظار QR',
    qr_required: 'يلزم QR',
    pairing: 'جارٍ الربط',
    connecting: 'جارٍ الاتصال',
    connected: 'متصل',
    disconnected: 'غير متصل',
    reconnecting: 'إعادة اتصال',
    logged_out: 'تم الخروج',
    failed: 'فشل',
    error: 'خطأ',
};

function deviceStatusTone(status: string): 'success' | 'warning' | 'neutral' | 'danger' {
    const normalized = status.toLowerCase();
    if (normalized === 'connected') {
        return 'success';
    }
    if (normalized.includes('pending') || normalized.includes('qr') || normalized.includes('pair') || normalized.includes('starting')) {
        return 'warning';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
        return 'danger';
    }
    return 'neutral';
}

function apiErrorMessage(err: unknown, fallback: string): string {
    const apiError = (err as { response?: { data?: { error?: { message?: string; code?: string } } } })?.response?.data
        ?.error;
    if (apiError?.code === 'DEVICE_LIMIT_EXCEEDED') {
        return 'وصلت لحد الأجهزة في خطتك. احذف جهازاً أو رقِّ الخطة.';
    }
    return apiError?.message ?? fallback;
}

export default function DevicesIndex() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [name, setName] = useState('جهاز واتساب');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function load() {
        try {
            const res = await apiGet<{ devices: Device[] }>('/devices');
            if (res.success && res.data?.devices) {
                setDevices(res.data.devices);
            }
        } catch {
            setError('تعذر تحميل الأجهزة');
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function createDevice() {
        setLoading(true);
        setError(null);
        try {
            const res = await apiPost<{ device: Device; integration?: { api_key?: string } }>('/devices', { name });
            if (!res.success || !res.data?.device) {
                setError(res.success ? 'فشل إنشاء الجهاز' : (res.error?.message ?? 'فشل إنشاء الجهاز'));
                return;
            }
            router.visit(`/devices/${res.data.device.id}`);
        } catch (err: unknown) {
            setError(apiErrorMessage(err, 'فشل إنشاء الجهاز'));
        } finally {
            setLoading(false);
        }
    }

    async function deleteDevice() {
        if (!deleteTarget) {
            return;
        }
        setDeleting(true);
        setError(null);
        try {
            const res = await apiDelete(`/devices/${deleteTarget.id}`);
            if (!res.success) {
                setError(res.error?.message ?? 'فشل حذف الجهاز');
                return;
            }
            setDeleteTarget(null);
            await load();
        } catch (err: unknown) {
            setError(apiErrorMessage(err, 'فشل حذف الجهاز'));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <TenantShell title="الأجهزة" description="اربط أرقام واتساب عبر رمز QR وإدارة الجلسات.">
            <div>
                <TenantPanel title="إضافة جهاز جديد" description="بعد الإنشاء ستُوجَّه مباشرة لصفحة ربط QR.">
                    <div className="tenant-toolbar">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="اسم الجهاز"
                        />
                        <Button type="button" disabled={loading} onClick={() => void createDevice()} className="w-full sm:w-auto">
                            <Plus className="size-4" aria-hidden />
                            {loading ? 'جارٍ الإنشاء...' : 'إضافة جهاز'}
                        </Button>
                    </div>
                    {error ? <p className="mt-4 text-sm text-[rgb(var(--danger-text))]">{error}</p> : null}
                </TenantPanel>
            </div>

            <div className="mt-6">
                <TenantPanel title={`الأجهزة (${devices.length})`} flush>
                    {devices.length === 0 ? (
                        <TenantEmptyState
                            icon={Smartphone}
                            title="لا توجد أجهزة بعد"
                            description="أضف جهازاً جديداً ثم اربطه عبر رمز QR لبدء إرسال الرسائل."
                        />
                    ) : (
                        <ul className="tenant-list">
                            {devices.map((device, index) => (
                                <li key={device.id} className="tenant-list__item" style={{ animationDelay: `${0.1 * (index + 2)}s` }}>
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/devices/${device.id}`}
                                            className="tenant-list__primary hover:text-[rgb(var(--brand-700))]"
                                        >
                                            {device.name}
                                        </Link>
                                        <p className="tenant-list__secondary" dir="ltr">
                                            {device.phone_e164 ?? 'لم يُربط بعد'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={deviceStatusTone(device.status)}>
                                            {STATUS_LABELS[device.status] ?? device.status}
                                        </Badge>
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href={`/devices/${device.id}`}>
                                                <Link2 className="size-4" />
                                                {device.status === 'connected' ? 'إدارة' : 'ربط QR'}
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDeleteTarget(device)}
                                        >
                                            <Trash2 className="size-4" />
                                            حذف
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </TenantPanel>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="حذف الجهاز"
                description={
                    deleteTarget
                        ? `هل تريد حذف «${deleteTarget.name}»؟ سيتم إنهاء الجلسة ولا يمكن التراجع.`
                        : undefined
                }
                confirmLabel="حذف"
                tone="danger"
                loading={deleting}
                onConfirm={deleteDevice}
            />
        </TenantShell>
    );
}
