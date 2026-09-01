import { usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/Components/patterns/LanguageSwitcher';
import { BrandLogo } from '@/Components/brand/BrandLogo';
import { LinkButton } from '@/Components/ui/LinkButton';
import { brand } from '@/DesignSystem/themes';
import { dashboardLabel, homePath, type SharedAuth } from '@/Lib/auth';
import { cn } from '@/Lib/cn';

const NAV = [
    { href: '/#features', label: 'المزايا' },
    { href: '/pricing', label: 'الأسعار' },
    { href: '/docs', label: 'التوثيق' },
    { href: '/faq', label: 'الأسئلة' },
    { href: '/status', label: 'الحالة' },
] as const;

type SiteHeaderPageProps = {
    appName?: string;
    auth?: SharedAuth;
};

export function SiteHeader() {
    const [open, setOpen] = useState(false);
    const page = usePage<SiteHeaderPageProps>().props;
    const appName = page.appName ?? brand.defaultDisplayName;
    const user = page.auth?.user ?? null;
    const dashboardHref = homePath(user);
    const dashboardText = dashboardLabel(user);

    return (
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="mx-auto flex h-[var(--topbar-height)] max-w-[var(--content-max-analytics)] items-center justify-between gap-4 px-4 md:px-8">
                <BrandLogo appName={appName} href="/" />

                <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--brand-700))]"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 sm:flex">
                    <LanguageSwitcher />
                    {user ? (
                        <LinkButton href={dashboardHref} size="sm">
                            {dashboardText}
                        </LinkButton>
                    ) : (
                        <>
                            <LinkButton href="/login" variant="ghost" size="sm">
                                تسجيل الدخول
                            </LinkButton>
                            <LinkButton href="/register" size="sm">
                                ابدأ الآن
                            </LinkButton>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-[rgb(var(--text))] lg:hidden"
                    aria-expanded={open}
                    aria-controls="mobile-nav"
                    aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            <div
                id="mobile-nav"
                className={cn(
                    'border-t border-[rgb(var(--border-soft))] bg-[rgb(var(--surface))] px-4 py-4 lg:hidden',
                    open ? 'block' : 'hidden',
                )}
            >
                <nav className="flex flex-col gap-3" aria-label="تنقل الجوال">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--brand-50))]"
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </a>
                    ))}
                    <div className="mt-2 flex flex-col gap-2">
                        {user ? (
                            <LinkButton href={dashboardHref}>{dashboardText}</LinkButton>
                        ) : (
                            <>
                                <LinkButton href="/login" variant="secondary">
                                    تسجيل الدخول
                                </LinkButton>
                                <LinkButton href="/register">ابدأ الآن</LinkButton>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
