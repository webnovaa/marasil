import * as React from 'react';
import { badgeVariants, type BadgeVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & BadgeVariantProps;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
