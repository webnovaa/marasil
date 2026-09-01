import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';

const FAQS = [
    { q: 'هل واتساب جاهز للإنتاج؟', a: 'محرك الإرسال يُفعَّل فقط عند WHATSAPP_ENGINE=baileys. في البيئات الأخرى تظهر الرسالة «الميزة غير متاحة» بدل QR وهمي.' },
    { q: 'كيف تُحتسب الرسالة؟', a: 'عند قبول الطلب يُحجز رصيد ذري. إعادة المحاولة لنفس الرسالة لا تُحتسب من جديد. التكرار بنفس Idempotency-Key لا يستهلك حصة.' },
    { q: 'هل يوجد بريد إلكتروني؟', a: 'لا قناة بريد إنتاج حالياً. OTP عبر القناة الداخلية، وmailer التطوير = log.' },
];

export default function FaqPage() {
    return (
        <MarketingLayout>
            <Head title="الأسئلة الشائعة" />
            <article className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8">
                <h1 className="text-h1 text-[rgb(var(--brand-950))]">الأسئلة الشائعة</h1>
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
