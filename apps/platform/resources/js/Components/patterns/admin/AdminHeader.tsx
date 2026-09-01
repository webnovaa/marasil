import { SidebarTrigger } from '@/Components/ui/Sidebar';
import { LanguageSwitcher } from '@/Components/patterns/LanguageSwitcher';

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-[var(--z-sticky)] shrink-0 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="flex h-[var(--admin-header-height,var(--topbar-height))] items-center gap-2 px-3 sm:px-4 md:px-6">
                <SidebarTrigger className="shrink-0" />
                <div className="flex-1" />
                <LanguageSwitcher />
            </div>
        </header>
    );
}
