import { FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { 
    Bell, 
    AlertTriangle, 
    CheckCircle2, 
    Megaphone, 
    Smartphone, 
    ShieldAlert, 
    Info,
    Check
} from 'lucide-react';
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

function getNotificationMeta(type: string) {
    if (type.includes('fail') || type.includes('error') || type.includes('alert')) {
        return {
            icon: AlertTriangle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
            tagBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
        };
    }
    if (type.includes('broadcast') || type.includes('announcement')) {
        return {
            icon: Megaphone,
            color: 'text-sky-600 dark:text-sky-400',
            bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60',
            tagBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
        };
    }
    if (type.includes('device') || type.includes('session')) {
        return {
            icon: Smartphone,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
            tagBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
        };
    }
    if (type.includes('security') || type.includes('quota')) {
        return {
            icon: ShieldAlert,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60',
            tagBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
        };
    }
    if (type.includes('success') || type.includes('connected')) {
        return {
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60',
            tagBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
        };
    }
    return {
        icon: Info,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800',
        tagBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    };
}

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
                    <Check className="h-4 w-4 me-1.5" />
                    {t('tenant.notifications.markAllRead')}
                </Button>
            }
        >
            <TenantPanel title={t('tenant.notifications.preferences')}>
                <form onSubmit={onPrefs} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" name="in_app_enabled" defaultChecked={preferences.in_app_enabled} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        {t('tenant.notifications.inApp')}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" name="usage_alerts_enabled" defaultChecked={preferences.usage_alerts_enabled} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                        {t('tenant.notifications.usageAlerts')}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" name="device_alerts_enabled" defaultChecked={preferences.device_alerts_enabled} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
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
                    <div className="divide-y divide-[rgb(var(--border))]">
                        {notifications.map((row) => {
                            const meta = getNotificationMeta(row.type);
                            const IconComponent = meta.icon;
                            const isUnread = !row.read_at;

                            return (
                                <div
                                    key={row.id}
                                    className={`flex items-start gap-4 p-4 transition-colors ${
                                        isUnread 
                                            ? 'bg-brand-500/[0.03] dark:bg-brand-500/[0.05]' 
                                            : 'opacity-75 hover:opacity-100'
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-xl border shrink-0 ${meta.bg}`}>
                                        <IconComponent className={`h-5 w-5 ${meta.color}`} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className={`text-sm font-semibold ${isUnread ? 'text-[rgb(var(--foreground))]' : 'text-[rgb(var(--foreground))]/80'}`}>
                                                {row.title}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${meta.tagBg}`}>
                                                {row.type}
                                            </span>
                                            {isUnread && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                                    جديد
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-[rgb(var(--muted))] leading-relaxed whitespace-pre-line">
                                            {row.body}
                                        </p>

                                        <p className="mt-2 text-xs text-[rgb(var(--muted))]/70">
                                            {formatDate(row.created_at)}
                                        </p>
                                    </div>

                                    {isUnread && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="shrink-0 text-xs"
                                            onClick={() => router.post(`/notifications/${row.id}/read`)}
                                        >
                                            {t('common.read')}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
