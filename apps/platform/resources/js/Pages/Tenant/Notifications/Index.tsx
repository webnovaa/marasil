import { FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
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
            title="الإشعارات"
            description="إشعارات داخل التطبيق فقط. لا قنوات بريد أو واتساب حتى تعمل فعلياً."
            headerActions={
                <Button variant="secondary" size="sm" onClick={() => router.post('/notifications/read-all')}>
                    تعليم الكل كمقروء
                </Button>
            }
        >
            <TenantPanel title="التفضيلات">
                <form onSubmit={onPrefs} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="in_app_enabled" defaultChecked={preferences.in_app_enabled} />
                        إشعارات داخل التطبيق
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="usage_alerts_enabled" defaultChecked={preferences.usage_alerts_enabled} />
                        تنبيهات الاستخدام
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="device_alerts_enabled" defaultChecked={preferences.device_alerts_enabled} />
                        تنبيهات الأجهزة
                    </label>
                    <p className="text-caption text-[rgb(var(--muted))]">تنبيهات الأمن الحرج لا يمكن تعطيلها.</p>
                    <Button type="submit" size="sm">
                        حفظ
                    </Button>
                </form>
            </TenantPanel>

            <TenantPanel title="الصندوق" flush>
                {notifications.length === 0 ? (
                    <TenantEmptyState icon={Bell} title="لا إشعارات" description="ستظهر هنا أحداث الحساب والاشتراك والاستخدام." />
                ) : (
                    <ul className="tenant-list">
                        {notifications.map((row) => (
                            <li key={row.id} className="tenant-list__item">
                                <div className="min-w-0">
                                    <p className="tenant-list__primary">{row.title}</p>
                                    <p className="tenant-list__secondary">{row.body}</p>
                                </div>
                                {row.read_at ? null : (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => router.post(`/notifications/${row.id}/read`)}
                                    >
                                        قراءة
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
