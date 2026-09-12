import { Link, usePage, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { LanguageSwitcher } from '@/Components/patterns/LanguageSwitcher';
import { NotificationBellDropdown } from '@/Components/patterns/NotificationBellDropdown';
import { Badge } from '@/Components/ui/Badge';
import { SidebarTrigger } from '@/Components/ui/Sidebar';
import type { SharedAuth, SharedSubscription } from '@/Lib/auth';

type PageProps = {
    auth?: SharedAuth;
    subscription?: SharedSubscription | null;
    unreadNotifications?: number;
};

type TenantHeaderProps = {
    title?: string;
};

export function TenantHeader({ title }: TenantHeaderProps) {
    const page = usePage<PageProps>().props;
    const user = page.auth?.user ?? null;
    const subscription = page.subscription;
    const unread = page.unreadNotifications ?? 0;
    const initials = (user?.full_name ?? user?.phone_e164 ?? 'م').slice(0, 2).toUpperCase();

    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({ only: ['unreadNotifications'] });
        }, 45000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <header className="admin-app-header sticky top-0 z-[var(--z-sticky)] shrink-0 border-b">
            <div className="flex h-[var(--tenant-header-height,var(--admin-header-height))] items-center gap-3 px-4 sm:px-5 md:px-6">
                <SidebarTrigger className="shrink-0" />
                {title ? (
                    <p className="min-w-0 truncate text-sm font-semibold tracking-tight text-[rgb(var(--brand-950))] sm:hidden">
                        {title}
                    </p>
                ) : null}
                <div className="hidden flex-1 sm:block" />
                <div className="ms-auto flex items-center gap-2 sm:gap-3">
                    <LanguageSwitcher />
                    {subscription?.is_usable && subscription.plan_name ? (
                        <Badge tone="brand" className="hidden sm:inline-flex">
                            {subscription.plan_name}
                        </Badge>
                    ) : subscription?.has_pending_request ? (
                        <Badge tone="warning" className="hidden sm:inline-flex">
                            طلب معلّق
                        </Badge>
                    ) : null}
                    <NotificationBellDropdown />
                    <Link href="/profile" className="tenant-header-chip">
                        <span className="tenant-header-chip__avatar">{initials}</span>
                        <span className="tenant-header-chip__name">{user?.full_name ?? 'مستخدم مراسيل'}</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
