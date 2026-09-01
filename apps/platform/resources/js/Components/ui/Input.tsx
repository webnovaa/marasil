import * as React from 'react';
import { inputVariants, type InputVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  InputVariantProps & {
    invalid?: boolean;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, state, invalid, type = 'text', ...props }, ref) => {
    const resolvedState = invalid ? 'error' : state;

    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || resolvedState === 'error' ? true : undefined}
        className={cn(inputVariants({ state: resolvedState }), className)}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
