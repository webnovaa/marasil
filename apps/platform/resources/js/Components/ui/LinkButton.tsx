import { Link, type InertiaLinkProps } from '@inertiajs/react';
import { buttonVariants, type ButtonVariantProps } from '@/DesignSystem/component-variants';
import { cn } from '@/Lib/cn';

export type LinkButtonProps = Omit<InertiaLinkProps, 'className' | 'size'> &
  ButtonVariantProps & {
    className?: string;
  };

/** Inertia Link styled as Button — avoids Radix Slot + Link incompatibility. */
export function LinkButton({
  className,
  variant,
  size,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
