import type { ThemeDirection } from '@/DesignSystem/themes';

export function isRtl(dir: ThemeDirection | string | undefined): boolean {
  return (dir ?? 'rtl') === 'rtl';
}

export function oppositeDirection(dir: ThemeDirection): ThemeDirection {
  return dir === 'rtl' ? 'ltr' : 'rtl';
}

/** Technical islands (API keys, URLs, code, E.164) stay LTR inside RTL UI. */
export const technicalDir = 'ltr' as const;

export const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring-brand))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--ring-offset))]';
