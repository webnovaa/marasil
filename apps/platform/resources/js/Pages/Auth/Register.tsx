import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { Button } from '@/Components/ui/Button';
import { Checkbox } from '@/Components/ui/Checkbox';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { PasswordInput } from '@/Components/ui/PasswordInput';
import { apiPost } from '@/Lib/api-client';
import { isValidWhatsAppE164 } from '@/Lib/phone';
import { useI18n } from '@/i18n/useI18n';

export default function Register() {
    const { locale } = useI18n();
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [accepted, setAccepted] = useState(false);
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

        if (!accepted) {
            setError('يجب الموافقة على الشروط.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiPost('/auth/register', {
                full_name: fullName,
                company_name: companyName || null,
                phone_e164: phone,
                password,
                password_confirmation: password,
                terms_accepted: true,
                preferred_locale: locale,
            });

            if (!res.success) {
                setError(res.error.message ?? 'تعذر إنشاء الحساب.');
                return;
            }

            router.visit(`/verify-otp?phone=${encodeURIComponent(phone)}`);
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
                ?.response?.data;
            setError(data?.error?.message ?? data?.message ?? 'تعذر إنشاء الحساب.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout title="إنشاء حساب" subtitle="سجّل برقم واتساب، تحقق عبر OTP، ثم اختر خطتك">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <FormField id="full-name" label="الاسم الكامل" required>
                    <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                    />
                </FormField>
                <FormField id="company" label="اسم الشركة" hint="اختياري">
                    <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        autoComplete="organization"
                    />
                </FormField>
                <WhatsAppPhoneField value={phone} onChange={setPhone} error={phoneError} />
                <FormField id="password" label="كلمة المرور" required hint="8 أحرف على الأقل">
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        autoComplete="new-password"
                    />
                </FormField>
                <div className="flex items-start gap-2">
                    <Checkbox
                        id="terms"
                        checked={accepted}
                        onCheckedChange={(v) => setAccepted(v === true)}
                    />
                    <Label htmlFor="terms" className="font-normal leading-6">
                        أوافق على الشروط وسياسة الاستخدام المقبول، وأتعهد بعدم الإرسال العشوائي.
                    </Label>
                </div>
                {error ? <p className="text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                <Button type="submit" className="w-full" loading={loading}>
                    متابعة
                </Button>
            </form>

            <p className="mt-6 text-center text-body-sm sm:text-start">
                لديك حساب؟{' '}
                <Link href="/login" className="font-semibold text-[rgb(var(--brand-700))] hover:underline">
                    تسجيل الدخول
                </Link>
            </p>
        </AuthLayout>
    );
}
