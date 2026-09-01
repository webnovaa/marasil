import { Link } from '@inertiajs/react';
import { Separator } from '@/Components/ui/Separator';
import { cn } from '@/Lib/cn';
import { brand } from '@/DesignSystem/themes';

const FOOTER_LINKS = {
    product: [
        { href: '/#features', label: 'المزايا' },
        { href: '/pricing', label: 'الأسعار' },
        { href: '/#how-it-works', label: 'كيف تعمل' },
        { href: '/register', label: 'إنشاء حساب' },
    ],
    legal: [
        { href: '/legal/terms', label: 'الشروط' },
        { href: '/legal/privacy', label: 'الخصوصية' },
        { href: '/legal/acceptable-use', label: 'الاستخدام المقبول' },
    ],
    support: [
        { href: '/faq', label: 'الأسئلة الشائعة' },
        { href: '/docs', label: 'التوثيق' },
        { href: '/contact', label: 'تواصل معنا' },
        { href: '/status', label: 'حالة الخدمة' },
    ],
} as const;

type SiteFooterProps = {
    variant?: 'default' | 'inverse';
};

export function SiteFooter({ variant = 'default' }: SiteFooterProps) {
    const year = new Date().getFullYear();
    const inverse = variant === 'inverse';

    return (
        <footer
            className={cn(
                'border-t',
                inverse
                    ? 'border-[rgb(var(--brand-900))] bg-[rgb(var(--brand-950))] text-[rgb(var(--inverse))]'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))]',
            )}
        >
            <div className="mx-auto grid max-w-[var(--content-max-analytics)] gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
                <div className="md:col-span-1">
                    <p
                        className={cn(
                            'text-h3',
                            inverse ? 'text-[rgb(var(--inverse))]' : 'text-[rgb(var(--brand-950))]',
                        )}
                    >
                        {brand.arabicDisplayName}
                    </p>
                    <p
                        className={cn('mt-1 text-caption', inverse ? 'text-[rgb(var(--brand-300))]' : 'text-[rgb(var(--muted))]')}
                        dir="ltr"
                    >
                        {brand.defaultDisplayName}
                    </p>
                    <p
                        className={cn(
                            'mt-4 max-w-xs text-body-sm',
                            inverse ? 'text-[rgb(var(--brand-200)/0.85)]' : 'text-[rgb(var(--muted))]',
                        )}
                    >
                        منصة API لإرسال إشعارات واتساب المشروعة للشركات — بثقة، تحكم، واشتراكات واضحة.
                    </p>
                </div>

                <FooterCol title="المنتج" links={FOOTER_LINKS.product} inverse={inverse} />
                <FooterCol title="قانوني" links={FOOTER_LINKS.legal} inverse={inverse} />
                <FooterCol title="الدعم" links={FOOTER_LINKS.support} inverse={inverse} />
            </div>

            <Separator className={inverse ? 'bg-[rgb(var(--brand-900))]' : undefined} />

            <div
                className={cn(
                    'mx-auto flex max-w-[var(--content-max-analytics)] flex-col gap-2 px-4 py-6 text-caption md:flex-row md:items-center md:justify-between md:px-8',
                    inverse ? 'text-[rgb(var(--brand-300))]' : 'text-[rgb(var(--subtle))]',
                )}
            >
                <p>© {year} {brand.arabicDisplayName} · جميع الحقوق محفوظة</p>
                <p>
                    تعتمد خدمة الربط على بروتوكول غير رسمي؛ استخدمها فقط مع مستلمين موافقين.
                </p>
            </div>
        </footer>
    );
}

function FooterCol({
    title,
    links,
    inverse,
}: {
    title: string;
    links: ReadonlyArray<{ href: string; label: string }>;
    inverse?: boolean;
}) {
    const linkClass = inverse
        ? 'text-body-sm text-[rgb(var(--brand-200)/0.9)] transition-colors hover:text-[rgb(var(--inverse))]'
        : 'text-body-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--brand-700))]';

    return (
        <div>
            <p className={cn('text-label', inverse ? 'text-[rgb(var(--inverse))]' : 'text-[rgb(var(--text))]')}>
                {title}
            </p>
            <ul className="mt-3 space-y-2">
                {links.map((link) => (
                    <li key={link.href}>
                        {link.href.includes('#') ? (
                            <a href={link.href} className={linkClass}>
                                {link.label}
                            </a>
                        ) : (
                            <Link href={link.href} className={linkClass}>
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
