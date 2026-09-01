import { FormField } from '@/Components/ui/FormField';
import { PhoneInput } from '@/Components/ui/PhoneInput';
import type { CountryCode } from 'libphonenumber-js';

export type WhatsAppPhoneFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (e164: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  defaultCountry?: CountryCode;
  hint?: string;
};

export function WhatsAppPhoneField({
  id = 'whatsapp-phone',
  label = 'رقم واتساب',
  value,
  onChange,
  error,
  required = true,
  disabled,
  defaultCountry = 'SY',
  hint = 'اختر نداء الدولة ثم أدخل رقم الجوال. سيتم التحقق تلقائيًا بصيغة دولية.',
}: WhatsAppPhoneFieldProps) {
  return (
    <FormField id={id} label={label} required={required} hint={error ? undefined : hint} error={error}>
      <PhoneInput
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        defaultCountry={defaultCountry}
        invalid={Boolean(error)}
      />
    </FormField>
  );
}
