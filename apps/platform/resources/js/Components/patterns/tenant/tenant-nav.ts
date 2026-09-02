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
import { t, type Locale } from '@/i18n';

export type TenantNavItem = {
    id: string;
    titleKey: string;
    title: string;
    href: string;
    icon: LucideIcon;
    requiresSubscription?: boolean;
};

export type TenantNavGroup = {
    id: string;
    labelKey: string;
    label: string;
    items: TenantNavItem[];
};

export function getTenantNavGroups(locale: Locale): TenantNavGroup[] {
    return [
        {
            id: 'workspace',
            labelKey: 'nav.groups.workspace',
            items: [
                { id: 'dashboard', titleKey: 'nav.dashboard', href: '/tenant', icon: LayoutDashboard, requiresSubscription: true },
                { id: 'devices', titleKey: 'nav.devices', href: '/devices', icon: Smartphone, requiresSubscription: true },
                { id: 'messages', titleKey: 'nav.messages', href: '/messages', icon: MessageSquare, requiresSubscription: true },
                { id: 'api-keys', titleKey: 'nav.apiKeys', href: '/api-keys', icon: KeyRound, requiresSubscription: true },
                { id: 'webhooks', titleKey: 'nav.webhooks', href: '/webhooks', icon: Webhook, requiresSubscription: true },
                { id: 'templates', titleKey: 'nav.templates', href: '/templates', icon: FileText, requiresSubscription: true },
            ],
        },
        {
            id: 'account',
            labelKey: 'nav.groups.account',
            items: [
                { id: 'usage', titleKey: 'nav.usage', href: '/usage', icon: BarChart3, requiresSubscription: true },
                { id: 'billing', titleKey: 'nav.billing', href: '/billing', icon: CreditCard, requiresSubscription: true },
                { id: 'plans', titleKey: 'nav.plans', href: '/plans', icon: Package },
                { id: 'subscription', titleKey: 'nav.subscription', href: '/subscription', icon: CreditCard },
                { id: 'team', titleKey: 'nav.team', href: '/team', icon: Users, requiresSubscription: true },
                { id: 'notifications', titleKey: 'nav.notifications', href: '/notifications', icon: Bell },
                { id: 'support', titleKey: 'nav.support', href: '/support', icon: LifeBuoy, requiresSubscription: true },
            ],
        },
    ].map((group) => ({
        ...group,
        label: t(locale, group.labelKey),
        items: group.items.map((item) => ({
            ...item,
            title: t(locale, item.titleKey),
        })),
    })) as TenantNavGroup[];
}

/** @deprecated use getTenantNavGroups(locale) */
export const TENANT_NAV_GROUPS = getTenantNavGroups('ar');

export function isTenantNavActive(pathname: string, href: string): boolean {
    if (href === '/tenant') {
        return pathname === '/tenant' || pathname === '/tenant/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}
