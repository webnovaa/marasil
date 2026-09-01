import { usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CreditCard,
    KeyRound,
    MessageSquare,
    Package,
    Smartphone,
    Webhook,
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantQuickAction } from '@/Components/patterns/tenant/TenantQuickAction';
import { TenantStatCard } from '@/Components/patterns/tenant/TenantStatCard';
import { TenantUsageBar } from '@/Components/patterns/tenant/TenantUsageBar';
import { Badge } from '@/Components/ui/Badge';
import { LinkButton } from '@/Components/ui/LinkButton';
import TenantShell from '@/Layouts/TenantShell';
import type { SharedAuth } from '@/Lib/auth';

type Subscription = {
    id: string;
    status: string;
    is_usable: boolean;
    plan_name: string;
    plan_slug: string;
    starts_at: string | null;
    ends_at: string | null;
    max_devices: number;
    monthly_message_limit: number;
} | null;

type Stats = {
    devices: number;
    api_keys: number;
    webhooks: number;
    messages_used: number;
};

type Props = {
    subscription: Subscription;
    stats: Stats;
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = {
        active: 'نشط',
        expired: 'منتهٍ',
        suspended: 'موقوف',
        grace: 'فترة سماح',
    };

    return labels[status] ?? status;
}

export default function TenantDashboardIndex({ subscription, stats }: Props) {
    const user = usePage<{ auth?: SharedAuth }>().props.auth?.user ?? null;
    const displayName = user?.full_name ?? user?.phone_e164 ?? 'عميل مراسيل';
    const maxDevices = subscription?.max_devices ?? 0;

    return (
        <TenantShell
            title="لوحة التحكم"
            description="نظرة عامة على اشتراكك وموارد حسابك على مراسيل."
            hidePageHead
        >
            <section className="tenant-hero" aria-label="ترحيب">
                <div className="tenant-hero__inner">
                    <div className="min-w-0">
                        <p className="tenant-hero__eyebrow">مرحباً بك</p>
                        <h2 className="tenant-hero__title">{displayName}</h2>
                        <p className="tenant-hero__subtitle">
                            {subscription?.is_usable
                                ? 'إدارة أجهزة واتساب، مفاتيح API، وWebhooks من مكان واحد.'
                                : 'فعّل اشتراكك للبدء بربط الأجهزة وإرسال الرسائل عبر API.'}
                        </p>
                    </div>
                    <div className="tenant-hero__meta">
                        {subscription ? (
                            <>
                                <span className="tenant-hero__pill">
                                    <Package className="size-3.5" aria-hidden />
                                    {subscription.plan_name}
                                </span>
                                {subscription.ends_at ? (
                                    <span className="tenant-hero__pill">
                                        ينتهي {formatDate(subscription.ends_at)}
                                    </span>
                                ) : null}
                            </>
                        ) : (
                            <LinkButton href="/plans" variant="accent" size="sm">
                                اختيار خطة
                            </LinkButton>
                        )}
                    </div>
                </div>
            </section>

            <section aria-labelledby="tenant-stats-heading" className="tenant-stat-grid mt-6">
                <h2 id="tenant-stats-heading" className="sr-only">
                    مؤشرات سريعة
                </h2>
                <TenantStatCard
                    title="الأجهزة"
                    value={stats.devices}
                    icon={Smartphone}
                    tone="brand"
                    usage={
                        maxDevices > 0
                            ? { current: stats.devices, max: maxDevices, label: 'استخدام الأجهزة' }
                            : undefined
                    }
                    hint={maxDevices <= 0 ? '—' : undefined}
                />
                <TenantStatCard
                    title="مفاتيح API"
                    value={stats.api_keys}
                    hint="مفاتيح نشطة"
                    icon={KeyRound}
                    tone="accent"
                />
                <TenantStatCard
                    title="Webhooks"
                    value={stats.webhooks}
                    hint="نقاط استقبال الأحداث"
                    icon={Webhook}
                    tone="neutral"
                />
            </section>

            <div className="tenant-dashboard-grid mt-6">
                <TenantPanel
                    title="اختصارات سريعة"
                    description="انتقل مباشرة إلى الأقسام الأكثر استخداماً."
                >
                    <div className="tenant-quick-grid tenant-quick-grid--4">
                        <TenantQuickAction
                            href="/devices"
                            title="الأجهزة"
                            description="ربط QR وإدارة الجلسات"
                            icon={Smartphone}
                        />
                        <TenantQuickAction
                            href="/api-keys"
                            title="مفاتيح API"
                            description="إنشاء وإدارة المفاتيح"
                            icon={KeyRound}
                            accent
                        />
                        <TenantQuickAction
                            href="/webhooks"
                            title="Webhooks"
                            description="استقبال أحداث الرسائل"
                            icon={Webhook}
                        />
                        <TenantQuickAction
                            href="/plans"
                            title="الخطط"
                            description="ترقية أو تغيير الاشتراك"
                            icon={Package}
                            accent
                        />
                    </div>
                </TenantPanel>

                <TenantPanel
                    title="الاشتراك"
                    description="حالة خطتك الحالية وحدود الاستخدام."
                    action={
                        <LinkButton href="/subscription" variant="ghost" size="sm">
                            <ArrowUpRight className="size-4" aria-hidden />
                            التفاصيل
                        </LinkButton>
                    }
                >
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-extrabold text-[rgb(var(--brand-950))]">
                                    {subscription.plan_name}
                                </p>
                                <Badge tone={subscription.is_usable ? 'success' : 'warning'}>
                                    {statusLabel(subscription.status)}
                                </Badge>
                            </div>
                            <dl className="tenant-detail-grid">
                                <div className="tenant-detail-item">
                                    <dt>تاريخ الانتهاء</dt>
                                    <dd>{formatDate(subscription.ends_at)}</dd>
                                </div>
                                <div className="tenant-detail-item">
                                    <dt>الرسائل / شهر</dt>
                                    <dd>{subscription.monthly_message_limit.toLocaleString('ar')}</dd>
                                </div>
                                <div className="tenant-detail-item">
                                    <dt>الأجهزة المسموحة</dt>
                                    <dd>{subscription.max_devices}</dd>
                                </div>
                            </dl>
                            {maxDevices > 0 ? (
                                <TenantUsageBar
                                    current={stats.devices}
                                    max={maxDevices}
                                    label="الأجهزة المستخدمة"
                                />
                            ) : null}
                            {subscription.monthly_message_limit > 0 ? (
                                <TenantUsageBar
                                    current={stats.messages_used}
                                    max={subscription.monthly_message_limit}
                                    label="الرسائل هذا الشهر"
                                />
                            ) : null}
                            <LinkButton href="/subscription" variant="secondary" size="sm" className="w-full sm:w-auto">
                                <CreditCard className="size-4" aria-hidden />
                                إدارة الاشتراك
                            </LinkButton>
                        </div>
                    ) : (
                        <div className="space-y-3 text-center sm:text-start">
                            <MessageSquare className="mx-auto size-8 text-[rgb(var(--muted))] sm:mx-0" aria-hidden />
                            <p className="text-body-sm text-[rgb(var(--muted))]">
                                لا يوجد اشتراك فعّال. اختر خطة للبدء.
                            </p>
                            <LinkButton href="/plans" className="w-full sm:w-auto">
                                اختيار خطة
                            </LinkButton>
                        </div>
                    )}
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
