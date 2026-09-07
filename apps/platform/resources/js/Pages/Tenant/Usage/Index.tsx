import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantUsageBar } from '@/Components/patterns/tenant/TenantUsageBar';
import { Alert } from '@/Components/ui/Alert';
import TenantShell from '@/Layouts/TenantShell';

type Usage = {
    messages_used: number;
    messages_limit: number;
    daily_limit_per_device: number;
    devices_used: number;
    devices_limit: number;
    webhooks_used: number;
    webhooks_limit: number;
};

type Props = {
    usage: Usage;
};

export default function UsageIndex({ usage }: Props) {
    return (
        <TenantShell title="الاستخدام" description="الحدود الفعلية من الاشتراك الحالي، وليست من اسم الخطة.">
            {usage.daily_limit_per_device > 0 ? (
                <Alert tone="neutral" title="الحد اليومي لكل جهاز" className="mb-4">
                    خطتك تسمح بـ {usage.daily_limit_per_device} رسالة يومياً لكل جهاز، بالإضافة إلى الحد الشهري.
                </Alert>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
                <TenantPanel title="الرسائل هذا الشهر">
                    <TenantUsageBar current={usage.messages_used} max={usage.messages_limit} label="الرسائل" />
                </TenantPanel>
                <TenantPanel title="الأجهزة">
                    <TenantUsageBar current={usage.devices_used} max={usage.devices_limit} label="الأجهزة" />
                    <p className="mt-3 text-caption text-[rgb(var(--muted))]">
                        كل جهاز يحصل تلقائياً على مفتاح إرسال خاص به.
                    </p>
                </TenantPanel>
                <TenantPanel title="إشعارات السيرفر (اختيارية)">
                    <TenantUsageBar current={usage.webhooks_used} max={usage.webhooks_limit} label="الروابط" />
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
