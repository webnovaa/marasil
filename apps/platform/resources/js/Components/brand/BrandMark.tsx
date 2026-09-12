import { brand } from '@/DesignSystem/themes';
import { cn } from '@/Lib/cn';

type BrandMarkProps = {
    appName?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    tone?: 'default' | 'inverse';
};

const sizes = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
    xl: 'size-16',
} as const;

/**
 * Official Marasil mark — logo-p on a soft plate that works on light and dark chrome.
 */
export function BrandMark({
    appName = brand.defaultDisplayName,
    className,
    size = 'md',
    tone = 'default',
}: BrandMarkProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[rgb(var(--canvas))]',
                tone === 'inverse' && 'shadow-[0_0_0_1px_rgb(255_255_255/0.12)]',
                tone === 'default' && 'ring-1 ring-[rgb(var(--border-subtle))]',
                sizes[size],
                className,
            )}
            aria-hidden
        >
            <img
                src={tone === 'inverse' ? brand.logoWhiteSrc : brand.logoSrc}
                alt=""
                className="size-full object-contain p-1"
                width={64}
                height={64}
                decoding="async"
            />
            <span className="sr-only">{brand.displayName(appName)}</span>
        </span>
    );
}
