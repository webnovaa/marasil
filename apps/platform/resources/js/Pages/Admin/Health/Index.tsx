import { CheckCircle2, XCircle } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { Badge } from '@/Components/ui/Badge';
import { useI18n } from '@/i18n';

type Probe = { ok: boolean; message: string; latency_ms?: number | null; engine?: string; device_status?: string | null; driver?: string };

type Health = {
    checked_at: string;
    database: Probe;
    redis: Probe;
    queue: Probe;
    whatsapp_service: Probe;
    platform_whatsapp: Probe;
    otp_channel: string;
    config: { whatsapp_engine: string; queue_driver: string; cache_driver: string };
};

function ProbeCard({ title, probe }: { title: string; probe: Probe }) {
    return (
        <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{title}</h3>
                {probe.ok ? (
                    <Badge tone="success"><CheckCircle2 className="size-3" /> OK</Badge>
                ) : (
                    <Badge tone="danger"><XCircle className="size-3" /> FAIL</Badge>
                )}
            </div>
            <p className="mt-2 font-mono text-sm" dir="ltr">{probe.message}</p>
            {probe.latency_ms != null && <p className="mt-1 text-caption text-[rgb(var(--muted))]">{probe.latency_ms} ms</p>}
            {probe.engine && <p className="text-caption">engine: {probe.engine}</p>}
            {probe.device_status && <p className="text-caption">device: {probe.device_status}</p>}
        </div>
    );
}

export default function AdminHealthIndex({ health }: { health: Health }) {
    const { t, formatDate } = useI18n();

    return (
        <AdminShell title={t('admin.health.title')} description={t('admin.health.description', { date: formatDate(health.checked_at, { dateStyle: 'medium', timeStyle: 'medium' }) })}>
            <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone={health.otp_channel === 'whatsapp' ? 'success' : health.otp_channel === 'fake' ? 'warning' : 'danger'}>
                    OTP: {health.otp_channel}
                </Badge>
                <Badge tone="neutral">Engine: {health.config.whatsapp_engine}</Badge>
                <Badge tone="neutral">Queue: {health.config.queue_driver}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ProbeCard title={t('admin.health.postgresql')} probe={health.database} />
                <ProbeCard title={t('admin.health.redis')} probe={health.redis} />
                <ProbeCard title={t('admin.health.queue')} probe={health.queue} />
                <ProbeCard title={t('admin.health.whatsappService')} probe={health.whatsapp_service} />
                <ProbeCard title={t('admin.health.officialWhatsapp')} probe={health.platform_whatsapp} />
            </div>
        </AdminShell>
    );
}
