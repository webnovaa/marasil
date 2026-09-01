import * as React from 'react';
import type { CountryCode } from 'libphonenumber-js';
import { Input } from '@/Components/ui/Input';
import { cn } from '@/Lib/cn';
import { technicalDir } from '@/Lib/direction';
import {
  exampleNational,
  formatNationalInput,
  listDialCountries,
  parseWhatsAppPhone,
  splitE164,
} from '@/Lib/phone';

export type PhoneInputProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultCountry?: CountryCode;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  nationalClassName?: string;
  onChange?: (e164: string) => void;
  onBlur?: () => void;
  onValidityChange?: (valid: boolean, error: string | null) => void;
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      id,
      name,
      value = '',
      defaultCountry = 'SY',
      disabled,
      required,
      invalid,
      className,
      nationalClassName,
      onChange,
      onBlur,
      onValidityChange,
    },
    ref,
  ) => {
    const countries = React.useMemo(() => listDialCountries(), []);
    const split = React.useMemo(
      () => splitE164(value, defaultCountry),
      [value, defaultCountry],
    );

    const [country, setCountry] = React.useState<CountryCode>(split.country);
    const [national, setNational] = React.useState(split.national);
    const [touched, setTouched] = React.useState(false);

    React.useEffect(() => {
      const next = splitE164(value, defaultCountry);
      setCountry(next.country);
      setNational(next.national);
    }, [value, defaultCountry]);

    const parsed = React.useMemo(
      () => parseWhatsAppPhone(country, national),
      [country, national],
    );

    React.useEffect(() => {
      onValidityChange?.(parsed.valid, parsed.error);
    }, [parsed.valid, parsed.error, onValidityChange]);

    const selectId = id ? `${id}-country` : undefined;
    const nationalId = id;
    const showError = Boolean((invalid || touched) && parsed.error);
    const placeholder = exampleNational(country) || '9XX XXX XXX';

    function emit(nextCountry: CountryCode, nextNational: string) {
      const result = parseWhatsAppPhone(nextCountry, nextNational);
      onChange?.(result.valid ? result.e164 : '');
    }

    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex gap-2" dir={technicalDir}>
          <label className="sr-only" htmlFor={selectId}>
            رمز الدولة
          </label>
          <select
            id={selectId}
            disabled={disabled}
            value={country}
            aria-label="رمز الدولة"
            className={cn(
              'h-10 max-w-[11.5rem] shrink-0 rounded-[var(--radius-md)] border bg-[rgb(var(--surface))] px-2 text-sm text-[rgb(var(--text))] shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring-brand))] focus-visible:ring-offset-2 disabled:opacity-50',
              showError ? 'border-[rgb(var(--danger))]' : 'border-[rgb(var(--border))]',
            )}
            onChange={(e) => {
              const next = e.target.value as CountryCode;
              setCountry(next);
              setTouched(true);
              const formatted = formatNationalInput(next, national);
              setNational(formatted);
              emit(next, formatted);
            }}
          >
            {countries.map((item) => (
              <option key={item.iso2} value={item.iso2}>
                {item.nameAr} ({item.dial})
              </option>
            ))}
          </select>

          <Input
            ref={ref}
            id={nationalId}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required={required}
            disabled={disabled}
            invalid={showError || invalid}
            dir={technicalDir}
            placeholder={placeholder}
            value={national}
            aria-invalid={showError || invalid ? true : undefined}
            aria-describedby={showError && id ? `${id}-phone-error` : undefined}
            className={cn('flex-1', nationalClassName)}
            onBlur={() => {
              setTouched(true);
              onBlur?.();
            }}
            onChange={(e) => {
              const formatted = formatNationalInput(country, e.target.value);
              setNational(formatted);
              setTouched(true);
              emit(country, formatted);
            }}
          />
        </div>

        <p className="text-caption text-[rgb(var(--subtle))]" dir={technicalDir}>
          الصيغة النهائية: {parsed.e164 || '—'}
        </p>

        {showError && parsed.error ? (
          <p
            id={id ? `${id}-phone-error` : undefined}
            role="alert"
            className="text-caption text-[rgb(var(--danger))]"
          >
            {parsed.error}
          </p>
        ) : null}
      </div>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
