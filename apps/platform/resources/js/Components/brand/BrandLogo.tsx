import { Link } from '@inertiajs/react';
import { brand } from '@/DesignSystem/themes';
import { cn } from '@/Lib/cn';
import { BrandMark } from './BrandMark';

type BrandLogoProps = {
    appName?: string;
    href?: string;
    compact?: boolean;
    className?: string;
    tone?: 'default' | 'inverse';
    /** Mark size when not compact. */
    markSize?: 'sm' | 'md' | 'lg';
};

/**
 * Official lockup: Marasil logo-p mark + wordmark.
 */
export function BrandLogo({
    appName = brand.defaultDisplayName,
    href = '/',
    compact = false,
    className,
    tone = 'default',
    markSize = 'md',
}: BrandLogoProps) {
    const label = brand.displayName(appName);
    const content = compact ? (
        <BrandMark appName={appName} size={markSize} tone={tone} />
    ) : (
        <>
            <BrandMark appName={appName} size={markSize} tone={tone} />
            <span
                className={cn(
                    'min-w-0 truncate text-h3 tracking-tight',
                    tone === 'inverse' ? 'text-[rgb(var(--sidebar-foreground))]' : 'text-[rgb(var(--brand-950))]',
                )}
            >
                {label}
            </span>
        </>
    );

    const classes = cn('inline-flex items-center gap-2.5 no-underline', className);

    if (href) {
        return (
            <Link href={href} className={classes} aria-label={label}>
                {content}
            </Link>
        );
    }

    return <span className={classes}>{content}</span>;
}
