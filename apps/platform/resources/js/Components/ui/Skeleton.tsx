import { cn } from '@/Lib/cn';

export type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[rgb(var(--border-soft))]',
        className,
      )}
    />
  );
}
