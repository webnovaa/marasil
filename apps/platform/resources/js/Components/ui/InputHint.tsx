import type { ReactNode } from 'react';
import { cn } from '@/Lib/cn';

export type InputHintProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export function InputHint({ id, children, className }: InputHintProps) {
  return (
    <p id={id} className={cn('text-caption text-[rgb(var(--muted))]', className)}>
      {children}
    </p>
  );
}
