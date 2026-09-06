import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { AdminHeader } from '@/Components/patterns/admin/AdminHeader';
import { AdminSidebar } from '@/Components/patterns/admin/AdminSidebar';
import { SidebarInset, SidebarProvider } from '@/Components/ui/Sidebar';

type AdminShellProps = PropsWithChildren<{
    title: string;
    description?: string;
    hidePageHead?: boolean;
}>;

export default function AdminShell({ children, title, description, hidePageHead = false }: AdminShellProps) {
    const locale = (usePage().props.locale as string | undefined) ?? 'ar';
    const dir = (usePage().props.dir as string | undefined) ?? (locale === 'ar' ? 'rtl' : 'ltr');

    return (
        <SidebarProvider lang={locale} dir={dir === 'ltr' ? 'ltr' : 'rtl'} className="admin-shell">
            <AdminSidebar />
            <SidebarInset className="overflow-x-clip rounded-none border-0 bg-[rgb(var(--canvas))] shadow-none">
                <AdminHeader />
                <div className="admin-shell__content flex flex-1 flex-col gap-5 sm:gap-6">
                    {!hidePageHead ? <header className="admin-page-head">
                        <h1>{title}</h1>
                        {description ? <p>{description}</p> : null}
                    </header> : null}
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
