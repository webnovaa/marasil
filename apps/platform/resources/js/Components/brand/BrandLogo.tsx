import { Link } from '@inertiajs/react';
import { brand } from '@/DesignSystem/themes';
import { cn } from '@/Lib/cn';
import { BrandMark } from './BrandMark';

type BrandLogoProps = {
    appName?: string;
    href?: string;
    compact?: boolean;
    className?: string;
};

/**
 * Wordmark + mark. Do not duplicate brand assets in feature components.
 * Official SVG/PNG files replace the monogram when the user supplies them.
 */
export function BrandLogo({
    appName = brand.defaultDisplayName,
    href = '/',
    compact = false,
    className,
}: BrandLogoProps) {
    const content = (
        <>
            <BrandMark appName={appName} size={compact ? 'sm' : 'md'} />
            {compact ? null : (
                <span className="min-w-0 truncate text-h3 text-[rgb(var(--brand-950))]">
                    {brand.displayName(appName)}
                </span>
            )}
        </>
    );

    const classes = cn('inline-flex items-center gap-2 no-underline', className);

    if (href) {
        return (
            <Link href={href} className={classes} aria-label={brand.displayName(appName)}>
                {content}
            </Link>
        );
    }

    return <span className={classes}>{content}</span>;
}
