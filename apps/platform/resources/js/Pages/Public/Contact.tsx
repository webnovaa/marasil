import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';

export default function ContactPage() {
    return (
        <MarketingLayout>
            <Head title="تواصل معنا" />
            <article className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8 md:py-20">
                <p className="marketing-kicker">تواصل</p>
                <h1 className="mt-4 text-h1 text-[rgb(var(--brand-950))]">تواصل معنا</h1>
                <p className="mt-3 text-body text-[rgb(var(--muted))]">
                    لا نموذج بريد في هذا الإصدار لأن SMTP الإنتاج غير مفعّل. بعد تسجيل الدخول افتح تذكرة من صفحة الدعم داخل الحساب.
                </p>
            </article>
        </MarketingLayout>
    );
}
