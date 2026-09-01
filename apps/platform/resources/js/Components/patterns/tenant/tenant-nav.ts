import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    CreditCard,
    FileText,
    KeyRound,
    LayoutDashboard,
    LifeBuoy,
    MessageSquare,
    Package,
    Smartphone,
    Users,
    Webhook,
    BarChart3,
} from 'lucide-react';

export type TenantNavItem = {
    id: string;
    title: string;
    href: string;
    icon: LucideIcon;
    requiresSubscription?: boolean;
};

export type TenantNavGroup = {
    id: string;
    label: string;
    items: TenantNavItem[];
};

export const TENANT_NAV_GROUPS: TenantNavGroup[] = [
    {
        id: 'workspace',
        label: 'مساحة العمل',
        items: [
            { id: 'dashboard', title: 'لوحة التحكم', href: '/tenant', icon: LayoutDashboard, requiresSubscription: true },
            { id: 'devices', title: 'الأجهزة', href: '/devices', icon: Smartphone, requiresSubscription: true },
            { id: 'messages', title: 'الرسائل', href: '/messages', icon: MessageSquare, requiresSubscription: true },
            { id: 'api-keys', title: 'مفاتيح API', href: '/api-keys', icon: KeyRound, requiresSubscription: true },
            { id: 'webhooks', title: 'Webhooks', href: '/webhooks', icon: Webhook, requiresSubscription: true },
            { id: 'templates', title: 'القوالب', href: '/templates', icon: FileText, requiresSubscription: true },
        ],
    },
    {
        id: 'account',
        label: 'الحساب',
        items: [
            { id: 'usage', title: 'الاستخدام', href: '/usage', icon: BarChart3, requiresSubscription: true },
            { id: 'billing', title: 'الفوترة', href: '/billing', icon: CreditCard, requiresSubscription: true },
            { id: 'plans', title: 'الخطط', href: '/plans', icon: Package },
            { id: 'subscription', title: 'اشتراكي', href: '/subscription', icon: CreditCard },
            { id: 'team', title: 'الفريق', href: '/team', icon: Users, requiresSubscription: true },
            { id: 'notifications', title: 'الإشعارات', href: '/notifications', icon: Bell },
            { id: 'support', title: 'الدعم', href: '/support', icon: LifeBuoy, requiresSubscription: true },
        ],
    },
];

export function isTenantNavActive(pathname: string, href: string): boolean {
    if (href === '/tenant') {
        return pathname === '/tenant' || pathname === '/tenant/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}
