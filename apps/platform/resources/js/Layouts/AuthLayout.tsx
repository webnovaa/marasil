import type { PropsWithChildren, ReactNode } from 'react';
import { SiteFooter } from '@/Components/patterns/SiteFooter';
import { SiteHeader } from '@/Components/patterns/SiteHeader';

type AuthLayoutProps = PropsWithChildren<{
    title: string;
    subtitle?: string;
    footer?: ReactNode;
}>;

export default function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
    return (
        <div lang="ar" dir="rtl" className="flex min-h-screen flex-col bg-[rgb(var(--canvas))] text-[rgb(var(--text))]">
            <SiteHeader />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
                <div className="auth-card w-full max-w-[var(--auth-form-max)]">
                    <div className="mb-6 text-center sm:text-start">
                        <h1 className="text-[clamp(1.5rem,3vw,1.875rem)] font-extrabold leading-tight text-[rgb(var(--text-primary))]">
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className="mt-2 text-body text-[rgb(var(--muted))]">{subtitle}</p>
                        ) : null}
                    </div>

                    {children}

                    {footer ? <div className="mt-6 border-t border-[rgb(var(--border-soft))] pt-5">{footer}</div> : null}
                </div>
            </main>

            <SiteFooter variant="inverse" />
        </div>
    );
}
