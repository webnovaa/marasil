import { FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type NotificationRow = {
    id: string;
    type: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string | null;
};

type Props = {
    notifications: NotificationRow[];
    preferences: {
        in_app_enabled: boolean;
        usage_alerts_enabled: boolean;
        device_alerts_enabled: boolean;
    };
};

export default function NotificationsIndex({ notifications, preferences }: Props) {
    const { t, formatDate } = useI18n();

    function onPrefs(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        router.post('/notifications/preferences', {
            in_app_enabled: form.get('in_app_enabled') === 'on',
            usage_alerts_enabled: form.get('usage_alerts_enabled') === 'on',
            device_alerts_enabled: form.get('device_alerts_enabled') === 'on',
        });
    }

    return (
        <TenantShell
            title={t('tenant.notifications.title')}
            description={t('tenant.notifications.description')}
            headerActions={
                <Button variant="secondary" size="sm" onClick={() => router.post('/notifications/read-all')}>
                    {t('tenant.notifications.markAllRead')}
                </Button>
            }
        >
            <TenantPanel title={t('tenant.notifications.preferences')}>
                <form onSubmit={onPrefs} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="in_app_enabled" defaultChecked={preferences.in_app_enabled} />
                        {t('tenant.notifications.inApp')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="usage_alerts_enabled" defaultChecked={preferences.usage_alerts_enabled} />
                        {t('tenant.notifications.usageAlerts')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="device_alerts_enabled" defaultChecked={preferences.device_alerts_enabled} />
                        {t('tenant.notifications.deviceAlerts')}
                    </label>
                    <p className="text-caption text-[rgb(var(--muted))]">{t('tenant.notifications.securityNote')}</p>
                    <Button type="submit" size="sm">
                        {t('common.save')}
                    </Button>
                </form>
            </TenantPanel>

            <TenantPanel title={t('tenant.notifications.inbox')} flush>
                {notifications.length === 0 ? (
                    <TenantEmptyState icon={Bell} title={t('tenant.notifications.emptyTitle')} description={t('tenant.notifications.emptyDescription')} />
                ) : (
                    <ul className="tenant-list">
                        {notifications.map((row) => (
                            <li key={row.id} className={`tenant-list__item ${row.read_at ? 'opacity-70' : ''}`}>
                                <div className="min-w-0 flex-1">
                                    <p className="tenant-list__primary">{row.title}</p>
                                    <p className="tenant-list__secondary">{row.body}</p>
                                    <p className="mt-1 text-caption text-[rgb(var(--muted))]">
                                        {row.type} · {formatDate(row.created_at)}
                                    </p>
                                </div>
                                {row.read_at ? null : (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => router.post(`/notifications/${row.id}/read`)}
                                    >
                                        {t('common.read')}
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
