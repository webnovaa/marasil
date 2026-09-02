import { Link, usePage } from '@inertiajs/react';
import { Lock, X } from 'lucide-react';
import { LinkButton } from '@/Components/ui/LinkButton';
import { IconButton } from '@/Components/ui/IconButton';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    useSidebar,
} from '@/Components/ui/Sidebar';
import {
    getTenantNavGroups,
    isTenantNavActive,
} from '@/Components/patterns/tenant/tenant-nav';
import { BrandLogo } from '@/Components/brand/BrandLogo';
import { BrandMark } from '@/Components/brand/BrandMark';
import { brand } from '@/DesignSystem/themes';
import type { SharedAuth, SharedSubscription } from '@/Lib/auth';
import { cn } from '@/Lib/cn';
import { useI18n } from '@/i18n';
import type { Locale } from '@/i18n';

type PageProps = {
    appName?: string;
    auth?: SharedAuth;
    subscription?: SharedSubscription | null;
    locale?: Locale;
};

export function TenantSidebar() {
    const page = usePage<PageProps>().props;
    const { t } = useI18n();
    const appName = page.appName ?? brand.defaultDisplayName;
    const user = page.auth?.user ?? null;
    const subscription = page.subscription;
    const navGroups = getTenantNavGroups(page.locale === 'en' ? 'en' : 'ar');
    const pathname = usePage().url.split('?')[0] ?? '/tenant';
    const { state, isMobile, setOpenMobile } = useSidebar();
    const collapsed = state === 'collapsed';
    const subscriptionUsable = subscription?.is_usable ?? false;

    return (
        <Sidebar side="right" variant="sidebar" collapsible="icon">
            <SidebarHeader className="pb-1">
                <div className="flex items-center justify-between gap-2 px-1 py-1">
                    <div className="flex min-w-0 items-center gap-3">
                        {collapsed && !isMobile ? (
                            <BrandMark appName={appName} size="md" />
                        ) : (
                            <div className="min-w-0">
                                <BrandLogo appName={appName} href="/tenant" />
                                <p className="truncate text-caption text-[rgb(var(--muted))]">{t('shell.tenantPanel')}</p>
                            </div>
                        )}
                    </div>
                    {isMobile ? (
                        <IconButton
                            label={t('shell.closeMenu')}
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={() => setOpenMobile(false)}
                        >
                            <X className="size-5" />
                        </IconButton>
                    ) : null}
                </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="gap-1 px-1">
                {navGroups.map((group) => (
                    <SidebarGroup key={group.id} className="py-1">
                        <SidebarGroupLabel className="text-caption uppercase tracking-[0.08em]">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isTenantNavActive(pathname, item.href);
                                    const locked =
                                        item.requiresSubscription === true && !subscriptionUsable;
                                    const href = locked ? '/plans' : item.href;

                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active && !locked}
                                                tooltip={
                                                    collapsed
                                                        ? locked
                                                            ? t('shell.subscriptionRequired', { title: item.title })
                                                            : item.title
                                                        : undefined
                                                }
                                                className={cn('h-10 px-3', locked && 'opacity-70')}
                                            >
                                                <Link href={href} onClick={() => setOpenMobile(false)}>
                                                    <Icon className="size-[1.125rem]" />
                                                    <span className="flex flex-1 items-center gap-2 text-[0.9375rem]">
                                                        {item.title}
                                                        {locked ? (
                                                            <Lock
                                                                className="size-3.5 text-[rgb(var(--muted))]"
                                                                aria-hidden
                                                            />
                                                        ) : null}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-[rgb(var(--sidebar-border))] pb-3 pt-2">
                <div className="flex items-center gap-3 px-1 py-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--neutral-bg))] text-sm font-bold text-[rgb(var(--brand-800))]">
                        {(user?.full_name ?? user?.phone_e164 ?? 'م').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--text))]">
                            {user?.full_name ?? t('shell.defaultTenant')}
                        </p>
                        <p className="truncate text-caption text-[rgb(var(--muted))]" dir="ltr">
                            {user?.phone_e164 ?? '—'}
                        </p>
                        {subscriptionUsable && subscription?.plan_name ? (
                            <p className="truncate text-caption text-[rgb(var(--brand-700))]">
                                {subscription.plan_name}
                            </p>
                        ) : null}
                    </div>
                </div>
                {user?.can_access_admin ? (
                    <div className="px-1 group-data-[collapsible=icon]/sidebar:hidden">
                        <LinkButton href="/admin" variant="secondary" size="sm" className="w-full">
                            {t('shell.adminArea')}
                        </LinkButton>
                    </div>
                ) : null}
                <div className="px-1 group-data-[collapsible=icon]/sidebar:hidden">
                    <LinkButton href="/logout" method="post" as="button" variant="ghost" size="sm" className="w-full">
                        {t('shell.logout')}
                    </LinkButton>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
