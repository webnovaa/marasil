import { Badge } from '@/Components/ui/Badge';
import {
  statusLabel,
  statusTone,
  type DeviceOrMessageStatus,
} from '@/Lib/status';
import { cn } from '@/Lib/cn';

export type StatusBadgeProps = {
  status: DeviceOrMessageStatus;
  locale?: 'ar' | 'en';
  className?: string;
  showDot?: boolean;
};

export function StatusBadge({
  status,
  locale = 'ar',
  className,
  showDot = true,
}: StatusBadgeProps) {
  const tone = statusTone(status);
  const label = statusLabel(status, locale);

  return (
    <Badge tone={tone} className={cn(className)} aria-label={label}>
      {showDot ? (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      ) : null}
      <span>{label}</span>
    </Badge>
  );
}
