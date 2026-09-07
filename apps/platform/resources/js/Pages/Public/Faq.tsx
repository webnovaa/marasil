import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';

const FAQS = [
    { q: 'هل الخدمة جاهزة للإنتاج؟', a: 'نعم عند تفعيل محرك الإرسال في بيئة الإنتاج. في بيئات التطوير قد تظهر رسالة «الميزة غير متاحة» حتى يكتمل الإعداد.' },
    { q: 'كيف تُحتسب الرسالة؟', a: 'عند قبول الطلب يُحجز رصيد ذري. إعادة المحاولة لنفس الرسالة لا تُحتسب من جديد. التكرار بنفس Idempotency-Key لا يستهلك حصة.' },
    { q: 'هل يوجد بريد إلكتروني؟', a: 'لا قناة بريد إنتاج حالياً. رموز التحقق تُرسل عبر واتساب المنصة.' },
];

export default function FaqPage() {
    return (
        <MarketingLayout>
            <Head title="الأسئلة الشائعة" />
            <article className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8 md:py-20">
                <p className="marketing-kicker">الدعم</p>
                <h1 className="mt-4 text-h1 text-[rgb(var(--brand-950))]">الأسئلة الشائعة</h1>
                <dl className="mt-8 space-y-6">
                    {FAQS.map((item) => (
                        <div key={item.q}>
                            <dt className="font-semibold text-[rgb(var(--brand-950))]">{item.q}</dt>
                            <dd className="mt-2 text-body text-[rgb(var(--muted))]">{item.a}</dd>
                        </div>
                    ))}
                </dl>
            </article>
        </MarketingLayout>
    );
}
