import type { LucideIcon } from 'lucide-react';
import { cn } from '@/Lib/cn';

export type StatCardProps = {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    className?: string;
};

export function StatCard({ title, value, description, icon: Icon, className }: StatCardProps) {
    return (
        <article className={cn('tenant-stat-card', className)}>
            <div className="tenant-stat-card__head">
                {Icon ? (
                    <div className="tenant-stat-card__icon tenant-stat-card__icon--brand">
                        <Icon className="size-5" aria-hidden />
                    </div>
                ) : (
                    <span className="size-12 shrink-0" aria-hidden />
                )}
                <p className="tenant-stat-card__label">{title}</p>
            </div>
            <p className="tenant-stat-card__value">{value}</p>
            {description ? <p className="tenant-stat-card__hint">{description}</p> : null}
        </article>
    );
}
