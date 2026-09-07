import type { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import { SiteHeader } from '@/Components/patterns/SiteHeader';
import { SiteFooter } from '@/Components/patterns/SiteFooter';
import { cn } from '@/Lib/cn';

type MarketingLayoutProps = PropsWithChildren<{
    className?: string;
}>;

export default function MarketingLayout({ children, className }: MarketingLayoutProps) {
    const locale = (usePage().props.locale as string | undefined) ?? 'ar';
    const dir = (usePage().props.dir as string | undefined) ?? (locale === 'ar' ? 'rtl' : 'ltr');

    return (
        <div
            lang={locale}
            dir={dir === 'ltr' ? 'ltr' : 'rtl'}
            className="marketing-shell flex min-h-screen flex-col text-[rgb(var(--text))]"
        >
            <SiteHeader />
            <main className={cn('flex-1', className)}>{children}</main>
            <SiteFooter />
        </div>
    );
}
