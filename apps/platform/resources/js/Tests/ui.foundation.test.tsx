import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { StatusBadge } from '@/Components/ui/StatusBadge';
import { statusLabel, statusTone } from '@/Lib/status';
import { cn } from '@/Lib/cn';
import { isRtl, oppositeDirection } from '@/Lib/direction';

describe('cn', () => {
  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('direction helpers', () => {
  it('detects rtl and opposite', () => {
    expect(isRtl('rtl')).toBe(true);
    expect(isRtl('ltr')).toBe(false);
    expect(oppositeDirection('rtl')).toBe('ltr');
  });
});

describe('status mapping', () => {
  it('maps connected to success with Arabic label', () => {
    expect(statusTone('connected')).toBe('success');
    expect(statusLabel('connected')).toBe('متصل وجاهز');
  });
});

describe('Button', () => {
  it('supports keyboard activation and loading state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick}>حفظ</Button>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'حفظ' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button loading onClick={onClick}>
        حفظ
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has no serious axe violations', async () => {
    const { container } = render(<Button>إجراء</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Input', () => {
  it('marks invalid state for accessibility', () => {
    render(<Input aria-label="الاسم" invalid />);
    expect(screen.getByLabelText('الاسم')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('StatusBadge', () => {
  it('renders Arabic status text (not color alone)', () => {
    render(<StatusBadge status="qr_required" />);
    expect(screen.getByText('يحتاج ربطًا')).toBeInTheDocument();
  });
});

describe('RTL / LTR wrappers', () => {
  it('preserves dir attributes', () => {
    const { rerender } = render(
      <div dir="rtl" data-testid="wrap">
        عربي
      </div>,
    );
    expect(screen.getByTestId('wrap')).toHaveAttribute('dir', 'rtl');
    rerender(
      <div dir="ltr" data-testid="wrap">
        Latin
      </div>,
    );
    expect(screen.getByTestId('wrap')).toHaveAttribute('dir', 'ltr');
  });
});
