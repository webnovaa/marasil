import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { buttonVariants, type ButtonVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';
import { Spinner } from '@/Components/ui/Spinner';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantProps & {
    asChild?: boolean;
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} aria-disabled={isDisabled || undefined} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? <Spinner className="size-4" label="جارٍ التحميل" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
