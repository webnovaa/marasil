import type { LucideIcon } from 'lucide-react';
import { TenantUsageBar } from '@/Components/patterns/tenant/TenantUsageBar';
import { cn } from '@/Lib/cn';

export type TenantStatCardProps = {
    title: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    tone?: 'brand' | 'accent' | 'neutral';
    usage?: { current: number; max: number; label?: string };
    className?: string;
};

export function TenantStatCard({
    title,
    value,
    hint,
    icon: Icon,
    tone = 'brand',
    usage,
    className,
}: TenantStatCardProps) {
    return (
        <article className={cn('tenant-stat-card', className)}>
            <div className="tenant-stat-card__head">
                <div className={cn('tenant-stat-card__icon', `tenant-stat-card__icon--${tone}`)}>
                    <Icon className="size-5" aria-hidden />
                </div>
                <p className="tenant-stat-card__label">{title}</p>
            </div>
            <p className="tenant-stat-card__value">{value}</p>
            {usage ? (
                <TenantUsageBar current={usage.current} max={usage.max} label={usage.label} />
            ) : hint ? (
                <p className="tenant-stat-card__hint">{hint}</p>
            ) : null}
        </article>
    );
}
