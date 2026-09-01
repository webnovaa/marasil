import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Building2,
    CreditCard,
    LayoutDashboard,
    LifeBuoy,
    Package,
    ScrollText,
    Users,
} from 'lucide-react';

export type AdminNavItem = {
    id: string;
    title: string;
    href: string;
    icon: LucideIcon;
};

export type AdminNavGroup = {
    id: string;
    label: string;
    items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        id: 'overview',
        label: 'نظرة عامة',
        items: [
            { id: 'dashboard', title: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
            { id: 'health', title: 'صحة النظام', href: '/admin/health', icon: Activity },
        ],
    },
    {
        id: 'users',
        label: 'المستخدمون',
        items: [
            { id: 'users', title: 'كل المستخدمين', href: '/admin/users', icon: Users },
            { id: 'pending-users', title: 'حسابات معلّقة', href: '/admin/users/pending', icon: Users },
            { id: 'tenants', title: 'الحسابات', href: '/admin/tenants', icon: Building2 },
        ],
    },
    {
        id: 'billing',
        label: 'الاشتراكات',
        items: [
            { id: 'subscription-requests', title: 'طلبات الاشتراك', href: '/admin/subscription-requests', icon: CreditCard },
            { id: 'subscriptions', title: 'الاشتراكات', href: '/admin/subscriptions', icon: CreditCard },
            { id: 'plans', title: 'الخطط', href: '/admin/plans', icon: Package },
        ],
    },
    {
        id: 'ops',
        label: 'التشغيل',
        items: [
            { id: 'support', title: 'الدعم', href: '/admin/support', icon: LifeBuoy },
            { id: 'audit', title: 'سجل التدقيق', href: '/admin/audit', icon: ScrollText },
        ],
    },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
    if (href === '/admin') {
        return pathname === '/admin' || pathname === '/admin/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}
