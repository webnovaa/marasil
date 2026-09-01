import * as React from 'react';
import { Button, type ButtonProps } from '@/Components/ui/Button';
import { cn } from '@/Lib/cn';

export type IconButtonProps = Omit<ButtonProps, 'size' | 'children'> & {
  label: string;
  children: React.ReactNode;
  size?: 'icon' | 'icon-sm';
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, size = 'icon', variant = 'ghost', children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(className)}
        aria-label={label}
        title={props.title ?? label}
        {...props}
      >
        {children}
      </Button>
    );
  },
);
IconButton.displayName = 'IconButton';
