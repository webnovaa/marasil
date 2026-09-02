import { FormEvent, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { Button } from '@/Components/ui/Button';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { apiPost } from '@/Lib/api-client';
import { isValidWhatsAppE164 } from '@/Lib/phone';

type Props = {
    resendCooldownSeconds: number;
    initialResendSeconds: number;
};

export default function VerifyOtp({ resendCooldownSeconds, initialResendSeconds }: Props) {
    const phoneFromQuery = useMemo(() => {
        if (typeof window === 'undefined') {
            return '';
        }
        return new URLSearchParams(window.location.search).get('phone') ?? '';
    }, []);

    const [phone, setPhone] = useState(phoneFromQuery);
    const [code, setCode] = useState('');
    const [phoneError, setPhoneError] = useState<string | undefined>();
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(initialResendSeconds);

    useEffect(() => {
        if (resendSeconds <= 0) {
            return;
        }

        const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [resendSeconds]);

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
            const res = await apiPost<{ redirect_to?: string }>('/auth/verify-phone', {
                phone_e164: phone,
                code,
            });

            if (!res.success) {
                setError(res.error.message ?? 'فشل التحقق.');
                return;
            }

            setInfo('تم التحقق بنجاح. جارٍ تحويلك لاختيار الخطة…');
            window.setTimeout(() => router.visit(res.data.redirect_to ?? '/plans'), 800);
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
                ?.response?.data;
            setError(data?.error?.message ?? data?.message ?? 'فشل التحقق.');
        } finally {
            setLoading(false);
        }
    }

    async function resend() {
        if (resendSeconds > 0 || resending) {
            return;
        }

        setInfo(null);
        setError(null);
        if (!isValidWhatsAppE164(phone)) {
            setPhoneError('أدخل رقم واتساب صحيحًا مع نداء الدولة.');
            return;
        }
        setPhoneError(undefined);
        setResending(true);
        try {
            await apiPost('/auth/resend-otp', { phone_e164: phone, purpose: 'registration' });
            setInfo('إن وُجد حساب مطابق فسيتم إرسال رمز جديد.');
            setResendSeconds(resendCooldownSeconds);
        } catch (err: unknown) {
            const data = (err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: { phone_e164?: string[] };
                    };
                };
            })?.response?.data;
            setError(data?.errors?.phone_e164?.[0] ?? data?.message ?? 'تعذر إعادة الإرسال الآن.');
            setResendSeconds(resendCooldownSeconds);
        } finally {
            setResending(false);
        }
    }

    return (
        <AuthLayout title="توثيق الرقم" subtitle="أدخل رمز OTP المرسل إلى واتساب">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <WhatsAppPhoneField value={phone} onChange={setPhone} error={phoneError} />
                <FormField id="otp" label="رمز التحقق" required>
                    <Input
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        maxLength={8}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="tracking-widest"
                        required
                    />
                </FormField>
                {error ? <p className="text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                {info ? <p className="text-sm text-[rgb(var(--brand-700))]">{info}</p> : null}
                <Button type="submit" className="w-full" loading={loading}>
                    تحقق
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => void resend()}
                    loading={resending}
                    disabled={resendSeconds > 0}
                >
                    {resendSeconds > 0
                        ? `إعادة الإرسال بعد ${resendSeconds} ثانية`
                        : 'إعادة إرسال الرمز'}
                </Button>
            </form>
        </AuthLayout>
    );
}
