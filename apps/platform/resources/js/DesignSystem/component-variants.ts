import { cva, type VariantProps } from 'class-variance-authority';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--highlight))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--ring-offset))]';

export const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold tracking-tight transition-[background,border-color,box-shadow,color] duration-[var(--motion-ui)] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${focusRing}`,
  {
    variants: {
      variant: {
        primary:
          'bg-[rgb(var(--brand-900))] text-[rgb(var(--text-inverse))] hover:bg-[rgb(var(--brand-800))] active:bg-[rgb(var(--brand-950))] disabled:bg-[rgb(var(--neutral-200))] disabled:text-[rgb(var(--text-disabled))] shadow-[var(--shadow-sm)]',
        secondary:
          'bg-[rgb(var(--surface))] text-[rgb(var(--brand-900))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-hover))] hover:border-[rgb(var(--brand-200))] active:bg-[rgb(var(--surface-pressed))] disabled:bg-[rgb(var(--neutral-200))] disabled:text-[rgb(var(--text-disabled))] disabled:border-[rgb(var(--neutral-200))] shadow-[var(--shadow-xs)]',
        outline:
          'border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] hover:border-[rgb(var(--brand-200))] active:bg-[rgb(var(--surface-pressed))]',
        ghost:
          'bg-transparent text-[rgb(var(--brand-800))] hover:bg-[rgb(var(--surface-hover))] active:bg-[rgb(var(--surface-pressed))]',
        danger:
          'bg-[rgb(var(--danger))] text-[rgb(var(--text-inverse))] hover:bg-[rgb(var(--danger-600))] active:bg-[rgb(var(--danger-700))] shadow-[var(--shadow-xs)]',
        accent:
          'bg-[rgb(var(--brand-800))] text-[rgb(var(--text-inverse))] hover:bg-[rgb(var(--brand-700))] active:bg-[rgb(var(--brand-900))] disabled:bg-[rgb(var(--neutral-200))] disabled:text-[rgb(var(--text-disabled))] shadow-[var(--shadow-sm)]',
        link: 'bg-transparent text-[rgb(var(--brand-800))] underline-offset-4 hover:underline shadow-none h-auto px-0 focus-visible:ring-offset-0',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[0.9375rem]',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium',
  {
    variants: {
      tone: {
        brand: 'bg-[rgb(var(--brand-100))] text-[rgb(var(--brand-800))] border border-[rgb(var(--brand-200))]',
        accent:
          'bg-[rgb(var(--accent-50))] text-[rgb(var(--accent-900))] border border-[rgb(var(--accent-200))]',
        success:
          'bg-[rgb(var(--success-background))] text-[rgb(var(--success-text))] border border-[rgb(var(--success-border))]',
        warning:
          'bg-[rgb(var(--warning-background))] text-[rgb(var(--warning-text))] border border-[rgb(var(--warning-border))]',
        danger:
          'bg-[rgb(var(--danger-background))] text-[rgb(var(--danger-text))] border border-[rgb(var(--danger-border))]',
        info: 'bg-[rgb(var(--info-background))] text-[rgb(var(--info-text))] border border-[rgb(var(--info-border))]',
        neutral:
          'bg-[rgb(var(--pending-background))] text-[rgb(var(--pending-foreground))] border border-[rgb(var(--pending-border))]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export const alertVariants = cva('relative w-full rounded-[var(--radius-lg)] border px-4 py-3.5 text-sm leading-relaxed', {
  variants: {
    tone: {
      info: 'bg-[rgb(var(--info-background))] border-[rgb(var(--info-border))] text-[rgb(var(--info-text))]',
      success:
        'bg-[rgb(var(--success-background))] border-[rgb(var(--success-border))] text-[rgb(var(--success-text))]',
      warning:
        'bg-[rgb(var(--warning-background))] border-[rgb(var(--warning-border))] text-[rgb(var(--warning-text))]',
      danger:
        'bg-[rgb(var(--danger-background))] border-[rgb(var(--danger-border))] text-[rgb(var(--danger-text))]',
      neutral:
        'bg-[rgb(var(--pending-background))] border-[rgb(var(--pending-border))] text-[rgb(var(--pending-foreground))]',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

export type AlertVariantProps = VariantProps<typeof alertVariants>;

export const inputVariants = cva(
  `flex h-11 w-full rounded-[var(--radius-md)] border bg-[rgb(var(--input-background))] px-3.5 py-2 text-sm text-[rgb(var(--input-text))] shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-[var(--motion-ui)] placeholder:text-[rgb(var(--input-placeholder))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--highlight)/0.35)] disabled:cursor-not-allowed disabled:bg-[rgb(var(--input-disabled-bg))] disabled:text-[rgb(var(--input-disabled-text))]`,
  {
    variants: {
      state: {
        default:
          'border-[rgb(var(--input-border))] hover:border-[rgb(var(--input-border-hover))] focus-visible:border-[rgb(var(--input-border-focus))]',
        error:
          'border-[rgb(var(--input-error-border))] focus-visible:ring-[rgb(var(--input-error-ring)/0.2)] focus-visible:border-[rgb(var(--input-error-border))]',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  },
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
