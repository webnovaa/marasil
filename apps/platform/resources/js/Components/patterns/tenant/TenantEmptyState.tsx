import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type TenantEmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
};

export function TenantEmptyState({ icon: Icon, title, description, action }: TenantEmptyStateProps) {
    return (
        <div className="tenant-empty">
            <div className="tenant-empty__icon">
                <Icon className="size-7" aria-hidden />
            </div>
            <p className="tenant-empty__title">{title}</p>
            <p className="tenant-empty__desc">{description}</p>
            {action ? <div className="mt-1">{action}</div> : null}
        </div>
    );
}
