import type { ReactNode } from 'react';
import { cn } from '@/Lib/cn';

export type FieldErrorProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className={cn('text-caption text-[rgb(var(--danger))]', className)}>
      {children}
    </p>
  );
}
