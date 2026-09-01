import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/Components/ui/Input';
import { IconButton } from '@/Components/ui/IconButton';
import { cn } from '@/Lib/cn';

export type PasswordInputProps = Omit<InputProps, 'type'> & {
  revealLabel?: string;
  hideLabel?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      revealLabel = 'إظهار كلمة المرور',
      hideLabel = 'إخفاء كلمة المرور',
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pe-11', className)}
          autoComplete={props.autoComplete ?? 'current-password'}
          {...props}
        />
        <IconButton
          type="button"
          label={visible ? hideLabel : revealLabel}
          size="icon-sm"
          className="absolute end-1 top-1/2 -translate-y-1/2"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </IconButton>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
