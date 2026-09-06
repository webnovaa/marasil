import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, ArrowUpRight, CreditCard, LifeBuoy, Package, Smartphone, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { StatCard } from '@/Components/patterns/admin/StatCard';
import { useI18n } from '@/i18n/useI18n';
import { hasPermission, type SharedAuth } from '@/Lib/auth';

type Stat = { title: string; value: number; description: string; tone: 'users' | 'billing' | 'plans' | 'devices' };
const icons: Record<Stat['tone'], LucideIcon> = { users: Users, billing: CreditCard, plans: Package, devices: Smartphone };
const titles = {
    ar: { users: 'حسابات بانتظار الموافقة', billing: 'طلبات اشتراك معلّقة', plans: 'خطط نشطة', devices: 'أجهزة متصلة' },
    en: { users: 'Pending accounts', billing: 'Pending subscriptions', plans: 'Active plans', devices: 'Connected devices' },
};
export default function AdminDashboardIndex({ stats }: { stats: Stat[] }) {
    const { locale } = useI18n();
    const ar = locale === 'ar';
    const user = usePage<{ auth?: SharedAuth }>().props.auth?.user;
    const actions = [
        { href: '/admin/users/pending', title: ar ? 'مراجعة الحسابات' : 'Review accounts', description: ar ? 'راجع طلبات الانضمام وفعّل الحسابات.' : 'Review registrations and activate accounts.', icon: Users, permission: 'users.view' },
        { href: '/admin/subscription-requests', title: ar ? 'طلبات الاشتراك' : 'Subscription requests', description: ar ? 'راجع إثباتات الدفع وطلبات التفعيل.' : 'Review payment proofs and activation requests.', icon: CreditCard, permission: 'subscriptions.view' },
        { href: '/admin/support', title: ar ? 'مركز الدعم' : 'Support center', description: ar ? 'تابع استفسارات العملاء وتذاكر الدعم.' : 'Follow up customer inquiries and support tickets.', icon: LifeBuoy, permission: 'support.manage' },
    ].filter((action) => hasPermission(user, action.permission));
    return (
        <AdminShell title={ar ? 'لوحة الإدارة' : 'Administration'} hidePageHead>
            <Head title={ar ? 'لوحة الإدارة' : 'Administration'} />
            <section className="dashboard-hero">
                <div className="min-w-0">
                    <p className="dashboard-hero__eyebrow">{ar ? 'مراسـيل / إدارة المنصة' : 'MARASIL / ADMINISTRATION'}</p>
                    <h1>{ar ? 'نظرة واضحة على أعمالك.' : 'A clear view of your operations.'}</h1>
                    <p className="dashboard-hero__description">{ar ? 'تابع العملاء والاشتراكات والاتصالات، وركّز على ما يحتاج اهتمامك اليوم.' : 'Monitor customers, subscriptions and connections. Focus on what needs your attention today.'}</p>
                </div>
                {hasPermission(user, 'settings.manage') ? <Link href="/admin/health" className="dashboard-hero__link"><Activity className="size-4" aria-hidden />{ar ? 'صحة النظام' : 'System health'}</Link> : null}
            </section>
            <section className="dashboard-stat-grid" aria-label={ar ? 'مؤشرات المنصة' : 'Platform metrics'}>
                {stats.map((stat) => <StatCard key={stat.tone} title={titles[locale][stat.tone]} value={new Intl.NumberFormat(locale).format(stat.value)} description={ar ? stat.description : 'Current platform count'} icon={icons[stat.tone]} />)}
            </section>
            <div className="dashboard-columns">
                <section className="dashboard-activity">
                    <div className="dashboard-section-head"><div><h2>{ar ? 'متابعة العمليات' : 'Operations'}</h2><p>{ar ? 'قوائم العمل التي تحتاج مراجعة فريقك.' : 'Work queues for your team to review.'}</p></div></div>
                    <div className="dashboard-action-list mt-6">
                        {actions.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="dashboard-action">
                            <span className="dashboard-action__icon"><Icon className="size-5" aria-hidden /></span>
                            <div className="min-w-0"><strong>{title}</strong><p>{description}</p></div>
                            <ArrowUpRight className="ms-auto size-4 shrink-0 rtl:-scale-x-100" aria-hidden />
                        </Link>)}
                        {actions.length === 0 ? <p className="text-sm text-[rgb(var(--muted))]">{ar ? 'تظهر أدوات العمل حسب صلاحيات حسابك.' : 'Operations are shown according to your permissions.'}</p> : null}
                    </div>
                </section>
                <section className="dashboard-activity">
                    <div className="dashboard-section-head"><div><h2>{ar ? 'إعدادات المنصة' : 'Platform setup'}</h2><p>{ar ? 'إدارة الخدمات والخطط من مكان واحد.' : 'Manage services and plans in one place.'}</p></div></div>
                    <div className="dashboard-action-list mt-6">
                        {hasPermission(user, 'plans.manage') ? <Link href="/admin/plans" className="dashboard-action"><span className="dashboard-action__icon"><Package className="size-5" aria-hidden /></span><div><strong>{ar ? 'الخطط والأسعار' : 'Plans and pricing'}</strong><p>{ar ? 'حدود الاستخدام ومزايا الاشتراكات.' : 'Usage limits and subscription features.'}</p></div></Link> : null}
                        {hasPermission(user, 'settings.manage') ? <Link href="/admin/platform-whatsapp" className="dashboard-action"><span className="dashboard-action__icon"><Smartphone className="size-5" aria-hidden /></span><div><strong>{ar ? 'واتساب المنصة' : 'Platform WhatsApp'}</strong><p>{ar ? 'الرقم المخصص لرسائل التحقق.' : 'The number used for verification messages.'}</p></div></Link> : null}
                        <Link href="/docs" className="dashboard-action"><div><strong>{ar ? 'دليل الربط' : 'Integration guide'}</strong><p>{ar ? 'مرجع واجهة البرمجة للمنصة.' : 'The platform API reference.'}</p></div><ArrowUpRight className="ms-auto size-4 rtl:-scale-x-100" aria-hidden /></Link>
                    </div>
                </section>
            </div>
        </AdminShell>
    );
}
