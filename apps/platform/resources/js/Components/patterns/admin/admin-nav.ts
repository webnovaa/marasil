import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Building2,
    CreditCard,
    LayoutDashboard,
    LifeBuoy,
    Megaphone,
    MessageCircle,
    Package,
    ScrollText,
    Users,
} from 'lucide-react';
import { t, type Locale } from '@/i18n';

export type AdminNavItem = {
    id: string;
    titleKey: string;
    title: string;
    href: string;
    icon: LucideIcon;
};

export type AdminNavGroup = {
    id: string;
    labelKey: string;
    label: string;
    items: AdminNavItem[];
};

export function getAdminNavGroups(locale: Locale): AdminNavGroup[] {
    return [
        {
            id: 'overview',
            labelKey: 'nav.admin.dashboard',
            items: [
                { id: 'dashboard', titleKey: 'nav.admin.dashboard', href: '/admin', icon: LayoutDashboard },
                { id: 'health', titleKey: 'nav.admin.health', href: '/admin/health', icon: Activity },
                { id: 'platform-whatsapp', titleKey: 'nav.admin.platformWhatsapp', href: '/admin/platform-whatsapp', icon: MessageCircle },
            ],
        },
        {
            id: 'users',
            labelKey: 'nav.admin.users',
            items: [
                { id: 'users', titleKey: 'nav.admin.users', href: '/admin/users', icon: Users },
                { id: 'pending-users', titleKey: 'nav.admin.pendingUsers', href: '/admin/users/pending', icon: Users },
                { id: 'tenants', titleKey: 'nav.admin.tenants', href: '/admin/tenants', icon: Building2 },
            ],
        },
        {
            id: 'billing',
            labelKey: 'nav.admin.subscriptions',
            items: [
                { id: 'subscription-requests', titleKey: 'nav.admin.subscriptionRequests', href: '/admin/subscription-requests', icon: CreditCard },
                { id: 'subscriptions', titleKey: 'nav.admin.subscriptions', href: '/admin/subscriptions', icon: CreditCard },
                { id: 'plans', titleKey: 'nav.admin.plans', href: '/admin/plans', icon: Package },
            ],
        },
        {
            id: 'ops',
            labelKey: 'nav.admin.support',
            items: [
                { id: 'broadcast', titleKey: 'nav.admin.broadcast', href: '/admin/broadcast', icon: Megaphone },
                { id: 'support', titleKey: 'nav.admin.support', href: '/admin/support', icon: LifeBuoy },
                { id: 'audit', titleKey: 'nav.admin.audit', href: '/admin/audit', icon: ScrollText },
            ],
        },
    ].map((group) => ({
        ...group,
        label: t(locale, group.labelKey),
        items: group.items.map((item) => ({
            ...item,
            title: t(locale, item.titleKey),
        })),
    })) as AdminNavGroup[];
}

/** @deprecated use getAdminNavGroups(locale) */
export const ADMIN_NAV_GROUPS = getAdminNavGroups('ar');

export function isAdminNavActive(pathname: string, href: string): boolean {
    if (href === '/admin') {
        return pathname === '/admin' || pathname === '/admin/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}
