import * as React from 'react';
import { alertVariants, type AlertVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  AlertVariantProps & {
    title?: string;
  };

export function Alert({ className, tone, title, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-sm opacity-95">{children}</div>
    </div>
  );
}
