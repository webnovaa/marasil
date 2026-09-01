import { CopyButton } from '@/Components/ui/CopyButton';
import { cn } from '@/Lib/cn';
import { technicalDir } from '@/Lib/direction';

export type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
};

export function CodeBlock({
  code,
  language = 'bash',
  className,
  showCopy = true,
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--brand-950))] text-[rgb(var(--inverse))]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-caption text-white/70">{language}</span>
        {showCopy ? <CopyButton value={code} className="text-white hover:bg-white/10" /> : null}
      </div>
      <pre
        dir={technicalDir}
        className="overflow-x-auto p-4 text-code font-mono leading-[var(--leading-code)]"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
