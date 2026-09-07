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
            <SidebarHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 px-1 py-1">
                    <div className="flex min-w-0 items-center gap-3">
                        {collapsed && !isMobile ? (
                            <BrandMark appName={appName} size="md" tone="inverse" />
                        ) : (
                            <div className="min-w-0">
                                <BrandLogo appName={appName} href="/tenant" tone="inverse" />
                                <p className="mt-1 truncate text-caption text-[rgb(var(--sidebar-muted))]">
                                    {t('shell.tenantPanel')}
                                </p>
                            </div>
                        )}
                    </div>
                    {isMobile ? (
                        <IconButton
                            label={t('shell.closeMenu')}
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-[rgb(var(--sidebar-foreground))] hover:bg-[rgb(255_255_255/0.08)]"
                            onClick={() => setOpenMobile(false)}
                        >
                            <X className="size-5" />
                        </IconButton>
                    ) : null}
                </div>
            </SidebarHeader>

            <SidebarSeparator className="bg-[rgb(255_255_255/0.08)]" />

            <SidebarContent className="gap-2 px-1">
                {navGroups.map((group) => (
                    <SidebarGroup key={group.id} className="py-1">
                        <SidebarGroupLabel>
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
                                                className={cn(
                                                    'h-11 px-3 text-[rgb(var(--sidebar-foreground))] hover:bg-[rgb(255_255_255/0.08)]',
                                                    locked && 'opacity-70',
                                                )}
                                            >
                                                <Link href={href} onClick={() => setOpenMobile(false)}>
                                                    <Icon className="size-[1.125rem] opacity-90" />
                                                    <span className="flex flex-1 items-center gap-2 text-[0.9375rem] font-medium">
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

            <SidebarFooter className="shell-sidebar-footer border-t border-[rgb(255_255_255/0.08)] pb-3 pt-3">
                <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[rgb(255_255_255/0.06)] px-2 py-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--highlight))] text-sm font-bold text-[rgb(var(--highlight-foreground))]">
                        {(user?.full_name ?? user?.phone_e164 ?? 'م').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--sidebar-foreground))]">
                            {user?.full_name ?? t('shell.defaultTenant')}
                        </p>
                        <p className="truncate text-caption text-[rgb(var(--sidebar-muted))]" dir="ltr">
                            {user?.phone_e164 ?? '—'}
                        </p>
                        {subscriptionUsable && subscription?.plan_name ? (
                            <p className="truncate text-caption text-[rgb(var(--highlight))]">
                                {subscription.plan_name}
                            </p>
                        ) : null}
                    </div>
                </div>
                {user?.can_access_admin ? (
                    <div className="px-0 group-data-[collapsible=icon]/sidebar:hidden">
                        <LinkButton href="/admin" variant="secondary" size="sm" className="w-full">
                            {t('shell.adminArea')}
                        </LinkButton>
                    </div>
                ) : null}
                <div className="px-0 group-data-[collapsible=icon]/sidebar:hidden">
                    <LinkButton href="/logout" method="post" as="button" variant="ghost" size="sm" className="w-full">
                        {t('shell.logout')}
                    </LinkButton>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
