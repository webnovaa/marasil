import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/Lib/cn';

type TenantPanelProps = PropsWithChildren<{
    title?: string;
    description?: string;
    action?: ReactNode;
    variant?: 'default' | 'soft';
    flush?: boolean;
    className?: string;
}>;

export function TenantPanel({
    title,
    description,
    action,
    variant = 'default',
    flush = false,
    className,
    children,
}: TenantPanelProps) {
    const hasHead = title || description || action;

    return (
        <section className={cn('tenant-panel', variant === 'soft' && 'tenant-panel--soft', className)}>
            {hasHead ? (
                <header className="tenant-panel__head">
                    <div className="min-w-0">
                        {title ? <h2 className="tenant-panel__title">{title}</h2> : null}
                        {description ? <p className="tenant-panel__desc">{description}</p> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </header>
            ) : null}
            <div className={cn('tenant-panel__body', flush && 'tenant-panel__body--flush')}>{children}</div>
        </section>
    );
}
