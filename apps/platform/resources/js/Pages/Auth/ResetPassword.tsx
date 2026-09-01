import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { Button } from '@/Components/ui/Button';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { PasswordInput } from '@/Components/ui/PasswordInput';
import { apiPost } from '@/Lib/api-client';
import { isValidWhatsAppE164 } from '@/Lib/phone';

export default function ResetPassword() {
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [phoneError, setPhoneError] = useState<string | undefined>();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!isValidWhatsAppE164(phone)) {
            setPhoneError('أدخل رقم واتساب صحيحًا مع نداء الدولة.');
            return;
        }
        setPhoneError(undefined);
        setLoading(true);

        try {
            const res = await apiPost('/auth/reset-password', {
                phone_e164: phone,
                code,
                password,
                password_confirmation: password,
            });

            if (!res.success) {
                setError(res.error.message ?? 'تعذر إعادة التعيين.');
                return;
            }

            router.visit('/login');
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
                ?.response?.data;
            setError(data?.error?.message ?? data?.message ?? 'تعذر إعادة التعيين.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout title="إعادة تعيين كلمة المرور">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <WhatsAppPhoneField value={phone} onChange={setPhone} error={phoneError} />
                <FormField id="otp" label="رمز OTP" required>
                    <Input
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                    />
                </FormField>
                <FormField id="password" label="كلمة المرور الجديدة" required>
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        autoComplete="new-password"
                    />
                </FormField>
                {error ? <p className="text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                <Button type="submit" className="w-full" loading={loading}>
                    حفظ كلمة المرور
                </Button>
            </form>

            <Link href="/login" className="mt-4 inline-block text-body-sm text-[rgb(var(--brand-700))] hover:underline">
                العودة لتسجيل الدخول
            </Link>
        </AuthLayout>
    );
}
