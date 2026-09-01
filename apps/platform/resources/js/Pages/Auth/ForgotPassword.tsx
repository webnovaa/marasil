import { FormEvent, useState } from 'react';
import { Link } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { Button } from '@/Components/ui/Button';
import { apiPost } from '@/Lib/api-client';
import { isValidWhatsAppE164 } from '@/Lib/phone';

export default function ForgotPassword() {
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState<string | undefined>();
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValidWhatsAppE164(phone)) {
            setPhoneError('أدخل رقم واتساب صحيحًا مع نداء الدولة.');
            return;
        }
        setPhoneError(undefined);
        setLoading(true);
        setInfo(null);

        try {
            await apiPost('/auth/forgot-password', { phone_e164: phone });
        } finally {
            setInfo('إن وُجد حساب مطابق فسيتم إرسال رمز إعادة التعيين.');
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="استعادة الحساب"
            subtitle="سنرسل رمزًا إلى واتساب إن وُجد حساب مرتبط بالرقم."
        >
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <WhatsAppPhoneField value={phone} onChange={setPhone} error={phoneError} />
                {info ? <p className="text-sm text-[rgb(var(--brand-700))]">{info}</p> : null}
                <Button type="submit" className="w-full" loading={loading}>
                    إرسال الرمز
                </Button>
            </form>

            <Link
                href="/reset-password"
                className="mt-4 inline-block text-body-sm font-semibold text-[rgb(var(--brand-700))] hover:underline"
            >
                لدي الرمز — إعادة تعيين كلمة المرور
            </Link>
        </AuthLayout>
    );
}
