import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type StatusEvent = { status: string; created_at: string | null };

type Message = {
    id: string;
    to: string;
    type: string;
    status: string;
    device_id: string | null;
    device_name?: string | null;
    provider_message_id?: string | null;
    idempotency_key?: string | null;
    queued_at: string | null;
    sent_at: string | null;
    failed_at: string | null;
    delivered_at: string | null;
    read_at: string | null;
    error_code: string | null;
    error_message: string | null;
    status_events: StatusEvent[];
};

export default function MessagesShow({ message }: { message: Message }) {
    const { t, formatDate } = useI18n();

    return (
        <TenantShell title={t('tenant.messages.showTitle')} description={message.id}>
            <Link href="/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-[rgb(var(--brand-700))] hover:underline">
                <ArrowRight className="size-4" /> {t('common.back')}
            </Link>

            <TenantPanel title={t('tenant.messages.info')}>
                <dl className="tenant-detail-grid">
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.recipient')}</dt><dd dir="ltr">{message.to}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('common.status')}</dt><dd><Badge>{message.status}</Badge></dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.type')}</dt><dd>{message.type}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.device')}</dt><dd>{message.device_name ?? message.device_id ?? t('common.emDash')}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.queuedAt')}</dt><dd>{formatDate(message.queued_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.sentAt')}</dt><dd>{formatDate(message.sent_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.messages.failedAt')}</dt><dd>{formatDate(message.failed_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
                    {message.error_code && (
                        <div className="tenant-detail-item sm:col-span-2"><dt>{t('tenant.messages.error')}</dt><dd>{message.error_code} {t('common.emDash')} {message.error_message}</dd></div>
                    )}
                    {message.provider_message_id && (
                        <div className="tenant-detail-item sm:col-span-2"><dt>{t('tenant.messages.providerId')}</dt><dd dir="ltr" className="font-mono text-sm">{message.provider_message_id}</dd></div>
                    )}
                </dl>
            </TenantPanel>

            {message.status_events.length > 0 && (
                <TenantPanel title={t('tenant.messages.statusHistory')} className="mt-4">
                    <ul className="space-y-2">
                        {message.status_events.map((e, i) => (
                            <li key={i} className="flex justify-between text-sm border-b border-[rgb(var(--border-soft))] py-2">
                                <Badge tone="neutral">{e.status}</Badge>
                                <span className="text-caption">{formatDate(e.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </li>
                        ))}
                    </ul>
                </TenantPanel>
            )}
        </TenantShell>
    );
}
