import { brand } from '@/DesignSystem/themes';
import { cn } from '@/Lib/cn';

type BrandMarkProps = {
    appName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
};

const sizes = {
    sm: 'size-8 text-caption',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
} as const;

/**
 * Product mark only. Official SVG assets are supplied later; until then this
 * renders the typographic monogram — not a temporary illustrated logo.
 */
export function BrandMark({ appName = brand.defaultDisplayName, className, size = 'md' }: BrandMarkProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--brand-100))] font-extrabold text-[rgb(var(--brand-800))]',
                sizes[size],
                className,
            )}
            aria-hidden
        >
            {brand.monogram(appName)}
        </span>
    );
}
