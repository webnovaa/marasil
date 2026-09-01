import * as React from 'react';
import { inputVariants, type InputVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  InputVariantProps & {
    invalid?: boolean;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, invalid, ...props }, ref) => {
    const resolvedState = invalid ? 'error' : state;

    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || resolvedState === 'error' ? true : undefined}
        className={cn(inputVariants({ state: resolvedState }), 'min-h-24 resize-y', className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
