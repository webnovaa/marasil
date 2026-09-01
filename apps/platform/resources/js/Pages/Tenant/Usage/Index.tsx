import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantUsageBar } from '@/Components/patterns/tenant/TenantUsageBar';
import TenantShell from '@/Layouts/TenantShell';

type Usage = {
    messages_used: number;
    messages_limit: number;
    devices_used: number;
    devices_limit: number;
    api_keys_used: number;
    api_keys_limit: number;
    webhooks_used: number;
    webhooks_limit: number;
};

type Props = {
    usage: Usage;
};

export default function UsageIndex({ usage }: Props) {
    return (
        <TenantShell title="الاستخدام" description="الحدود الفعلية من الاشتراك الحالي، وليست من اسم الخطة.">
            <div className="grid gap-4 md:grid-cols-2">
                <TenantPanel title="الرسائل هذا الشهر">
                    <TenantUsageBar current={usage.messages_used} max={usage.messages_limit} label="الرسائل" />
                </TenantPanel>
                <TenantPanel title="الأجهزة">
                    <TenantUsageBar current={usage.devices_used} max={usage.devices_limit} label="الأجهزة" />
                </TenantPanel>
                <TenantPanel title="مفاتيح API">
                    <TenantUsageBar current={usage.api_keys_used} max={usage.api_keys_limit} label="المفاتيح" />
                </TenantPanel>
                <TenantPanel title="Webhooks">
                    <TenantUsageBar current={usage.webhooks_used} max={usage.webhooks_limit} label="Webhooks" />
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
