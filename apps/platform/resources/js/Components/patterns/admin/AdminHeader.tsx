import { SidebarTrigger } from '@/Components/ui/Sidebar';
import { LanguageSwitcher } from '@/Components/patterns/LanguageSwitcher';
import { NotificationBellDropdown } from '@/Components/patterns/NotificationBellDropdown';

export function AdminHeader() {
    return (
        <header className="admin-app-header sticky top-0 z-[var(--z-sticky)] shrink-0 border-b">
            <div className="flex h-[var(--admin-header-height,var(--topbar-height))] items-center gap-3 px-4 sm:px-5 md:px-6">
                <SidebarTrigger className="shrink-0" />
                <div className="flex-1" />
                <NotificationBellDropdown />
                <LanguageSwitcher />
            </div>
        </header>
    );
}
