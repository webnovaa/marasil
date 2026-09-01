import type { PropsWithChildren } from 'react';

type GuestLayoutProps = PropsWithChildren<{
    title?: string;
}>;

export default function GuestLayout({ children }: GuestLayoutProps) {
    return (
        <div
            lang="ar"
            dir="rtl"
            className="min-h-screen bg-[rgb(var(--canvas))] text-[rgb(var(--text-primary))]"
        >
            <main>{children}</main>
        </div>
    );
}
