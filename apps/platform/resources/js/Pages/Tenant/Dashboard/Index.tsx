import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CreditCard, MessageSquare, Smartphone, Webhook } from 'lucide-react';
import { DashboardActivity, type ActivityDay } from '@/Components/patterns/DashboardActivity';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantStatCard } from '@/Components/patterns/tenant/TenantStatCard';
import { TenantUsageBar } from '@/Components/patterns/tenant/TenantUsageBar';
import { Badge } from '@/Components/ui/Badge';
import TenantShell from '@/Layouts/TenantShell';
import type { SharedAuth } from '@/Lib/auth';
import { useI18n } from '@/i18n/useI18n';

type Props = {
    subscription: { is_usable: boolean; status: string; plan_name: string; ends_at: string | null; max_devices: number; monthly_message_limit: number } | null;
    stats: { devices: number; webhooks: number; messages_used: number };
    activity?: ActivityDay[];
};

export default function TenantDashboardIndex({ subscription, stats, activity = [] }: Props) {
    const { locale } = useI18n();
    const ar = locale === 'ar';
    const user = usePage<{ auth?: SharedAuth }>().props.auth?.user;
    const name = user?.full_name ?? user?.phone_e164 ?? (ar ? 'حسابك' : 'your workspace');
    const number = new Intl.NumberFormat(locale);
    const end = subscription?.ends_at
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(subscription.ends_at)) : '—';
    const actions = [
        { href: '/devices', title: ar ? 'إدارة الأجهزة' : 'Manage devices', description: ar ? 'اربط رقم واتساب واحصل على مفتاح الإرسال تلقائياً.' : 'Connect WhatsApp and get a send key automatically.', icon: Smartphone },
        { href: '/messages', title: ar ? 'سجل الرسائل' : 'Message history', description: ar ? 'تابع رسائلك وحالات التسليم.' : 'Review messages and delivery status.', icon: MessageSquare },
        { href: '/webhooks', title: ar ? 'إشعارات الإرسال' : 'Delivery alerts', description: ar ? 'تنبيهات الفشل أو ربط سيرفرك.' : 'Failure alerts or optional server hooks.', icon: Webhook },
        { href: '/docs', title: ar ? 'دليل المطوّر' : 'Developer guide', description: ar ? 'خطوات الربط والإرسال عبر API.' : 'Connect devices and send via API.', icon: BookOpen },
    ];
    return (
        <TenantShell title={ar ? 'لوحة التحكم' : 'Dashboard'} hidePageHead>
            <Head title={ar ? 'لوحة التحكم' : 'Dashboard'} />
            <section className="dashboard-hero">
                <div className="min-w-0">
                    <p className="dashboard-hero__eyebrow">{ar ? 'مراسـيل / مساحة العمل' : 'MARASIL / WORKSPACE'}</p>
                    <h1>{ar ? 'أهلًا، ' : 'Welcome, '}{name}</h1>
                    <p className="dashboard-hero__description">{ar ? 'كل ما تحتاجه لإدارة تواصلك مع عملائك، في مساحة واحدة.' : 'Everything you need to manage customer messaging, in one workspace.'}</p>
                </div>
                <Link href="/devices" className="dashboard-hero__link"><Smartphone className="size-4" aria-hidden />{ar ? 'إدارة الأجهزة' : 'Manage devices'}</Link>
            </section>
            <section className="dashboard-stat-grid" aria-label={ar ? 'مؤشرات الحساب' : 'Workspace metrics'}>
                <TenantStatCard title={ar ? 'الرسائل هذا الشهر' : 'Messages this month'} value={number.format(stats.messages_used)} hint={ar ? 'من رصيد اشتراكك الحالي' : 'Against your current allowance'} icon={MessageSquare} />
                <TenantStatCard title={ar ? 'الأجهزة' : 'Devices'} value={number.format(stats.devices)} hint={ar ? 'كل جهاز بمفتاح إرسال جاهز' : 'Each device ships with a send key'} icon={Smartphone} />
                <TenantStatCard title={ar ? 'إشعارات الإرسال' : 'Delivery alerts'} value={number.format(stats.webhooks)} hint={ar ? 'روابط السيرفر الاختيارية' : 'Optional server URLs'} icon={Webhook} tone="neutral" />
            </section>
            <div className="dashboard-columns">
                <DashboardActivity days={activity} locale={locale} />
                <TenantPanel title={ar ? 'اشتراكك الحالي' : 'Your subscription'} description={ar ? 'تابع رصيدك وموعد تجديدك.' : 'Track your allowance and renewal date.'}>
                    {subscription ? <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <strong className="text-lg">{subscription.plan_name}</strong>
                            <Badge tone={subscription.is_usable ? 'success' : 'warning'}>{subscription.is_usable ? (ar ? 'متاح للاستخدام' : 'Available') : (ar ? 'غير فعّال' : 'Inactive')}</Badge>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-[rgb(var(--muted))]">{ar ? 'تاريخ الانتهاء' : 'Expires on'}</span><span>{end}</span></div>
                        {subscription.monthly_message_limit > 0 ? <TenantUsageBar current={stats.messages_used} max={subscription.monthly_message_limit} locale={locale} label={ar ? 'رصيد الرسائل' : 'Message allowance'} /> : <p className="text-sm">{subscription.monthly_message_limit < 0 ? (ar ? 'رسائل غير محدودة' : 'Unlimited messages') : (ar ? 'لا يوجد رصيد رسائل' : 'No message allowance')}</p>}
                        {subscription.max_devices > 0 ? <TenantUsageBar current={stats.devices} max={subscription.max_devices} locale={locale} label={ar ? 'الأجهزة' : 'Devices'} /> : null}
                        <Link href="/subscription" className="dashboard-action"><CreditCard className="size-4" aria-hidden /><strong>{ar ? 'إدارة الاشتراك' : 'Manage subscription'}</strong><ArrowUpRight className="ms-auto size-4 rtl:-scale-x-100" aria-hidden /></Link>
                    </div> : <Link href="/plans" className="dashboard-action">{ar ? 'اختر خطة وابدأ بإرسال رسائلك' : 'Choose a plan to start messaging'}</Link>}
                </TenantPanel>
            </div>
            <TenantPanel title={ar ? 'خطوتك التالية' : 'Your next step'} description={ar ? 'وصول سريع إلى أدوات العمل اليومية.' : 'Quick access to your everyday tools.'}>
                <div className="grid gap-3 lg:grid-cols-4">
                    {actions.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="dashboard-action">
                        <span className="dashboard-action__icon"><Icon className="size-5" aria-hidden /></span>
                        <div className="min-w-0"><strong>{title}</strong><p>{description}</p></div>
                        <ArrowUpRight className="ms-auto size-4 shrink-0 rtl:-scale-x-100" aria-hidden />
                    </Link>)}
                </div>
            </TenantPanel>
        </TenantShell>
    );
}
