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
        <article
            className={cn(
                'admin-panel p-5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                {Icon ? (
                    <Icon className="size-5 shrink-0 text-[rgb(var(--subtle))]" aria-hidden />
                ) : (
                    <span className="size-5 shrink-0" aria-hidden />
                )}
                <p className="min-w-0 flex-1 text-end text-body-sm font-medium text-[rgb(var(--muted))]">{title}</p>
            </div>

            <p className="font-tabular mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-none text-[rgb(var(--brand-950))] tracking-tight">
                {value}
            </p>

            {description ? (
                <p className="mt-2 text-caption text-[rgb(var(--subtle))]">{description}</p>
            ) : null}
        </article>
    );
}
