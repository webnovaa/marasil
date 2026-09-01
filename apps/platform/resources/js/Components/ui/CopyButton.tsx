import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from '@/Components/ui/IconButton';
import { cn } from '@/Lib/cn';

export type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function CopyButton({
  value,
  label = 'نسخ',
  copiedLabel = 'تم النسخ',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <IconButton
      type="button"
      label={copied ? copiedLabel : label}
      size="icon-sm"
      variant="ghost"
      className={cn(className)}
      onClick={() => void onCopy()}
    >
      {copied ? <Check aria-hidden className="text-[rgb(var(--success))]" /> : <Copy aria-hidden />}
    </IconButton>
  );
}
