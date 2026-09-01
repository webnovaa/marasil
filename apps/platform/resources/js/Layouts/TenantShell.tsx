import type { PropsWithChildren, ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { SubscriptionGateBanner } from '@/Components/patterns/tenant/SubscriptionGateBanner';
import { TenantHeader } from '@/Components/patterns/tenant/TenantHeader';
import { TenantSidebar } from '@/Components/patterns/tenant/TenantSidebar';
import { SidebarInset, SidebarProvider } from '@/Components/ui/Sidebar';
import { cn } from '@/Lib/cn';

type TenantShellProps = PropsWithChildren<{
    title: string;
    description?: string;
    width?: 'default' | 'wide' | 'narrow';
    hidePageHead?: boolean;
    headerActions?: ReactNode;
}>;

export default function TenantShell({
    children,
    title,
    description,
    width = 'default',
    hidePageHead = false,
    headerActions,
}: TenantShellProps) {
    const locale = (usePage().props.locale as string | undefined) ?? 'ar';
    const dir = (usePage().props.dir as string | undefined) ?? (locale === 'ar' ? 'rtl' : 'ltr');

    return (
        <SidebarProvider lang={locale} dir={dir === 'ltr' ? 'ltr' : 'rtl'} className="tenant-shell admin-shell">
            <TenantSidebar />
            <SidebarInset className="overflow-x-clip rounded-none border-0 bg-[rgb(var(--canvas))] shadow-none">
                <TenantHeader title={title} />
                <div
                    className={cn(
                        'tenant-shell__content admin-shell__content flex flex-1 flex-col gap-4 sm:gap-5',
                        width === 'wide' && 'tenant-shell__content--wide',
                        width === 'narrow' && 'tenant-shell__content--narrow',
                    )}
                >
                    <SubscriptionGateBanner />
                    {!hidePageHead ? (
                        <header className="tenant-page-head admin-page-head">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h1>{title}</h1>
                                    {description ? <p>{description}</p> : null}
                                </div>
                                {headerActions ? (
                                    <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div>
                                ) : null}
                            </div>
                        </header>
                    ) : null}
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
