import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/Lib/cn';

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  required?: boolean;
};

export const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn('text-label text-[rgb(var(--text))]', className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ms-1 text-[rgb(var(--danger))]" aria-hidden>
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = 'Label';
