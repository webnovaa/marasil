import { cn } from '@/Lib/cn';

export type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = 'جارٍ التحميل' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--brand-600))]',
        className,
      )}
    />
  );
}
