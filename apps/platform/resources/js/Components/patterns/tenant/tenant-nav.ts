import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    CreditCard,
    LayoutDashboard,
    LifeBuoy,
    MessageSquare,
    Package,
    Smartphone,
    UserRound,
    Webhook,
    BarChart3,
    Megaphone,
    Users,
    Bot,
    Sparkles,
    MessagesSquare,
    ShoppingBag,
    Code2,
    TrendingUp,
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
                { id: 'chat', titleKey: 'nav.chat', href: '/chat', icon: MessagesSquare, requiresSubscription: true },
                { id: 'aiAssistant', titleKey: 'nav.aiAssistant', href: '/ai-assistant', icon: Sparkles, requiresSubscription: true },
                { id: 'devices', titleKey: 'nav.devices', href: '/devices', icon: Smartphone, requiresSubscription: true },
                { id: 'messages', titleKey: 'nav.messages', href: '/messages', icon: MessageSquare, requiresSubscription: true },
                { id: 'campaigns', titleKey: 'nav.campaigns', href: '/campaigns', icon: Megaphone, requiresSubscription: true },
                { id: 'contacts', titleKey: 'nav.contacts', href: '/contacts', icon: Users, requiresSubscription: true },
                { id: 'autoReplies', titleKey: 'nav.autoReplies', href: '/auto-replies', icon: Bot, requiresSubscription: true },
                { id: 'integrations', titleKey: 'nav.integrations', href: '/integrations', icon: ShoppingBag, requiresSubscription: true },
                { id: 'widget', titleKey: 'nav.widget', href: '/widget', icon: Code2, requiresSubscription: true },
                { id: 'analytics', titleKey: 'nav.analytics', href: '/analytics', icon: TrendingUp, requiresSubscription: true },
                { id: 'webhooks', titleKey: 'nav.webhooks', href: '/webhooks', icon: Webhook, requiresSubscription: true },
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
                { id: 'notifications', titleKey: 'nav.notifications', href: '/notifications', icon: Bell },
                { id: 'profile', titleKey: 'nav.profile', href: '/profile', icon: UserRound },
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
