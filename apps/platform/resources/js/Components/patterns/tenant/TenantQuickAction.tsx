import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/Lib/cn';

type TenantQuickActionProps = {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    accent?: boolean;
};

export function TenantQuickAction({ href, title, description, icon: Icon, accent }: TenantQuickActionProps) {
    return (
        <Link
            href={href}
            className={cn('tenant-quick-action', accent && 'tenant-quick-action--accent')}
        >
            <span className="tenant-quick-action__icon">
                <Icon className="size-[1.125rem]" aria-hidden />
            </span>
            <span>
                <span className="tenant-quick-action__title">{title}</span>
                <p className="tenant-quick-action__desc">{description}</p>
            </span>
        </Link>
    );
}
