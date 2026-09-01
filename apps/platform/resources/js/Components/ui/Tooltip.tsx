import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/Lib/cn';

export const TooltipProvider = TooltipPrimitive.Provider;

export type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  className?: string;
};

export function Tooltip({
  content,
  children,
  side = 'top',
  delayDuration = 200,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-[var(--z-dropdown)] max-w-xs rounded-[var(--radius-sm)] bg-[rgb(var(--brand-950))] px-2.5 py-1.5 text-caption text-[rgb(var(--inverse))] shadow-[var(--shadow-sm)]',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[rgb(var(--brand-950))]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
