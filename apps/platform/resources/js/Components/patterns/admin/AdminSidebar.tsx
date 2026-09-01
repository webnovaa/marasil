import { Link, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
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
import { ADMIN_NAV_GROUPS, isAdminNavActive } from '@/Components/patterns/admin/admin-nav';
import { BrandLogo } from '@/Components/brand/BrandLogo';
import { BrandMark } from '@/Components/brand/BrandMark';
import { brand } from '@/DesignSystem/themes';
import type { SharedAuth } from '@/Lib/auth';

export function AdminSidebar() {
    const page = usePage<{ appName?: string; auth?: SharedAuth }>().props;
    const appName = page.appName ?? brand.defaultDisplayName;
    const user = page.auth?.user ?? null;
    const pathname = usePage().url.split('?')[0] ?? '/admin';
    const { state, isMobile, setOpenMobile } = useSidebar();
    const collapsed = state === 'collapsed';

    return (
        <Sidebar side="right" variant="sidebar" collapsible="icon">
            <SidebarHeader className="pb-1">
                <div className="flex items-center justify-between gap-2 px-1 py-1">
                    <div className="flex min-w-0 items-center gap-3">
                        {collapsed && !isMobile ? (
                            <BrandMark appName={appName} size="md" />
                        ) : (
                            <div className="min-w-0">
                                <BrandLogo appName={appName} href="/admin" />
                                <p className="truncate text-caption text-[rgb(var(--muted))]">لوحة الإدارة</p>
                            </div>
                        )}
                    </div>
                    {isMobile ? (
                        <IconButton
                            label="إغلاق القائمة"
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
                {ADMIN_NAV_GROUPS.map((group) => (
                    <SidebarGroup key={group.id} className="py-1">
                        <SidebarGroupLabel className="text-caption uppercase tracking-[0.08em]">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isAdminNavActive(pathname, item.href);

                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                tooltip={collapsed ? item.title : undefined}
                                                className="h-10 px-3"
                                            >
                                                <Link href={item.href} onClick={() => setOpenMobile(false)}>
                                                    <Icon className="size-[1.125rem]" />
                                                    <span className="text-[0.9375rem]">{item.title}</span>
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
                            {user?.full_name ?? 'مسؤول المنصة'}
                        </p>
                        <p className="truncate text-caption text-[rgb(var(--muted))]" dir="ltr">
                            {user?.phone_e164 ?? '—'}
                        </p>
                    </div>
                </div>
                {user?.can_access_tenant ? (
                    <div className="px-1 group-data-[collapsible=icon]/sidebar:hidden">
                        <LinkButton href={user?.home_path ?? '/tenant'} variant="secondary" size="sm" className="w-full">
                            منطقة العميل
                        </LinkButton>
                    </div>
                ) : null}
                <div className="px-1 group-data-[collapsible=icon]/sidebar:hidden">
                    <LinkButton href="/logout" method="post" as="button" variant="ghost" size="sm" className="w-full">
                        تسجيل الخروج
                    </LinkButton>
                </div>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
