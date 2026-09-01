import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { Button } from '@/Components/ui/Button';
import { FormField } from '@/Components/ui/FormField';
import { PasswordInput } from '@/Components/ui/PasswordInput';
import { apiPost } from '@/Lib/api-client';
import { isValidWhatsAppE164 } from '@/Lib/phone';

export default function Login() {
    const [phone, setPhone] = useState('');
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
            const res = await apiPost<{ user: { status: string }; redirect_to: string }>('/auth/login', {
                phone_e164: phone,
                password,
            });

            if (!res.success) {
                setError(res.error.message ?? 'فشل تسجيل الدخول');
                return;
            }

            router.visit(res.data.redirect_to ?? '/dashboard');
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
                    ?.response?.data?.error?.message ??
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'فشل تسجيل الدخول';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout title="تسجيل الدخول" subtitle="أدخل رقم واتساب وكلمة المرور">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <WhatsAppPhoneField value={phone} onChange={setPhone} error={phoneError} />
                <FormField id="password" label="كلمة المرور" required>
                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-body-sm text-[rgb(var(--muted))] hover:underline">
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </FormField>
                {error ? <p className="text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                <Button type="submit" className="w-full" loading={loading}>
                    دخول
                </Button>
            </form>

            <p className="mt-6 text-center text-body-sm sm:text-start">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="font-semibold text-[rgb(var(--brand-700))] hover:underline">
                    إنشاء حساب
                </Link>
            </p>
        </AuthLayout>
    );
}
