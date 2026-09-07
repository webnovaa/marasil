import { Head } from '@inertiajs/react';
import {
    KeyRound,
    Link2,
    MessageSquare,
    ShieldCheck,
    Smartphone,
    Webhook,
} from 'lucide-react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';
import { brand } from '@/DesignSystem/themes';
import { PlanCard, type PublicPlan } from '@/Components/patterns/PlanCard';
import { Alert } from '@/Components/ui/Alert';
import { LinkButton } from '@/Components/ui/LinkButton';
import { CodeBlock } from '@/Components/ui/CodeBlock';

type HomeProps = {
    plans: PublicPlan[];
};

const FEATURES = [
    {
        icon: Smartphone,
        title: 'أجهزة واتساب متعددة',
        body: 'اربط أجهزة مؤسستك، راقب الحالة، وأعد الربط عند الحاجة دون فوضى.',
    },
    {
        icon: KeyRound,
        title: 'مفاتيح API آمنة',
        body: 'مفاتيح Live/Test، صلاحيات دقيقة، وإظهار السر مرة واحدة فقط.',
    },
    {
        icon: MessageSquare,
        title: 'إرسال موثوق عبر الطوابير',
        body: 'طلبات 202 مع idempotency وتتبع حالات الإرسال حتى التسليم أو الفشل.',
    },
    {
        icon: Webhook,
        title: 'Webhooks موقّعة',
        body: 'أحداث موقّعة HMAC مع حماية من SSRF وإعادة محاولة مدروسة.',
    },
    {
        icon: ShieldCheck,
        title: 'موافقة وإدارة اشتراك',
        body: 'حسابات بموافقة إدارية وخطط واضحة وحدود استهلاك قابلة للتتبع.',
    },
    {
        icon: Link2,
        title: 'تكامل سريع',
        body: 'REST واضح، أمثلة جاهزة، ولوحة عربية RTL للعمليات اليومية.',
    },
] as const;

const STEPS = [
    { step: '01', title: 'أنشئ حسابًا', body: 'سجّل برقم واتساب وتحقق عبر OTP ثم انتظر الموافقة.' },
    { step: '02', title: 'اختر خطة', body: 'ابدأ بالتجربة المجانية أو اختر خطة تناسب حجم رسائلك.' },
    { step: '03', title: 'اربط جهازًا', body: 'امسح رمز QR واربط جهاز واتساب عبر الجلسة الآمنة.' },
    { step: '04', title: 'أرسل عبر API', body: 'انسخ مفتاح الجهاز من لوحته وأرسل إشعارات لمن وافقوا على التواصل فقط.' },
] as const;

const FAQ = [
    {
        q: 'كيف تعمل المنصة؟',
        a: 'تربط جلسة واتساب عبر الأجهزة المرتبطة، ثم تُرسل الإشعارات عبر واجهة API واضحة للمستلمين الموافقين فقط.',
    },
    {
        q: 'هل يوجد تجربة مجانية؟',
        a: 'نعم. خطة تجريبية مجانية لمدة محدودة بعد موافقة الإدارة لتختبر الربط والإرسال.',
    },
    {
        q: 'كيف تُدار الخطط؟',
        a: 'الخطط تُدار من لوحة الإدارة: إضافة، تعديل، تعطيل أو حذف ناعم، مع ترتيب عرض واضح.',
    },
    {
        q: 'هل يمكن إرسال رسائل عشوائية؟',
        a: 'لا. المنصة للاستخدام المشروع مع مستلمين موافقين فقط ضمن سياسة الاستخدام المقبول.',
    },
] as const;

export default function Home({ plans }: HomeProps) {
    const highlightSlug = plans.find((p) => p.slug === 'business')?.slug ?? plans[1]?.slug;

    return (
        <MarketingLayout>
            <Head title="مراسيل — WhatsApp API للشركات" />

            <section className="marketing-hero">
                <div className="marketing-hero__grid">
                    <div>
                        <p className="marketing-kicker">مراسيل · Marasil</p>
                        <h1 className="mt-5 text-h1 text-[rgb(var(--text-primary))] sm:text-display">
                            إشعارات واتساب عبر API بثقة واحتراف
                        </h1>
                        <p className="mt-5 max-w-xl text-body-lg text-[rgb(var(--muted))]">
                            اربط أجهزتك، استخدم مفتاح الإرسال التلقائي لكل جهاز، راقب الرسائل والإشعارات — مع اشتراكات وحدود واضحة تناسب الشركات.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <LinkButton href="/register" size="lg">
                                ابدأ التجربة
                            </LinkButton>
                            <LinkButton href="/pricing" size="lg" variant="secondary">
                                عرض الأسعار
                            </LinkButton>
                        </div>
                        <p className="mt-6 text-caption text-[rgb(var(--subtle))]">
                            بدون بطاقة عند التسجيل · موافقة إدارية قبل الإرسال
                        </p>
                    </div>

                    <div className="marketing-preview">
                        <div className="marketing-preview__logo">
                            <img
                                src={brand.logoSrc}
                                alt="مراسيل"
                                className="marketing-preview__logo-img"
                                width={320}
                                height={320}
                                decoding="async"
                            />
                        </div>
                        <div className="marketing-preview__panel">
                            <p className="mb-3 text-caption text-white/70">لوحة الأجهزة · معاينة</p>
                            <div className="space-y-2.5">
                                {[
                                    { name: 'جهاز المبيعات 1', status: 'متصل وجاهز', tone: 'text-[rgb(var(--success-200))]' },
                                    { name: 'جهاز الدعم 2', status: 'يحتاج ربطًا', tone: 'text-[rgb(var(--warning-300))]' },
                                    { name: 'جهاز التسويق 3', status: 'جارٍ الاتصال', tone: 'text-white/70' },
                                ].map((device) => (
                                    <div key={device.name} className="marketing-preview__row">
                                        <span className="font-medium">{device.name}</span>
                                        <span className={`text-caption ${device.tone}`}>{device.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="marketing-preview__stats">
                            {[
                                { k: 'الأجهزة', v: '12' },
                                { k: 'اليوم', v: '1.4k' },
                                { k: 'نجاح', v: '99.1%' },
                            ].map((stat) => (
                                <div key={stat.k} className="marketing-preview__stat">
                                    <p className="font-tabular text-h4 text-[rgb(var(--text-primary))]">{stat.v}</p>
                                    <p className="text-caption text-[rgb(var(--muted))]">{stat.k}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="marketing-trust">
                <span>عزل مستأجرين</span>
                <span>مفاتيح مُجزّأة</span>
                <span>Webhooks موقّعة</span>
                <span>حدود اشتراك</span>
                <span>سجلات تدقيق</span>
            </section>

            <section id="how-it-works" className="marketing-section scroll-mt-24">
                <h2 className="text-h2 text-[rgb(var(--text-primary))]">كيف تعمل</h2>
                <p className="mt-2 max-w-2xl text-body text-[rgb(var(--muted))]">
                    أربع خطوات واضحة من التسجيل حتى أول رسالة ناجحة.
                </p>
                <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((item) => (
                        <li key={item.step} className="marketing-step">
                            <p className="marketing-step__index">{item.step}</p>
                            <h3 className="mt-4 text-h4 text-[rgb(var(--text-primary))]">{item.title}</h3>
                            <p className="mt-2 text-body-sm leading-relaxed text-[rgb(var(--muted))]">{item.body}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section id="features" className="marketing-section--surface scroll-mt-24">
                <div className="marketing-section">
                    <h2 className="text-h2 text-[rgb(var(--text-primary))]">مزايا المنصة</h2>
                    <p className="mt-2 max-w-2xl text-body text-[rgb(var(--muted))]">
                        أدوات تشغيل يومية للفرق التقنية وغير التقنية.
                    </p>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <article key={feature.title} className="marketing-card">
                                <div className="marketing-card__icon">
                                    <feature.icon className="size-5" aria-hidden />
                                </div>
                                <h3 className="mt-4 text-h4 text-[rgb(var(--text-primary))]">{feature.title}</h3>
                                <p className="mt-2 text-body-sm leading-relaxed text-[rgb(var(--muted))]">{feature.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="marketing-section">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 className="text-h2 text-[rgb(var(--text-primary))]">تجربة API واضحة</h2>
                        <p className="mt-3 text-body text-[rgb(var(--muted))]">
                            أرسل نصًا خلال ثوانٍ بمفتاح Bearer، واستقبل معرف الرسالة وحالة الانتظار فورًا.
                        </p>
                    </div>
                    <CodeBlock
                        language="bash"
                        code={`curl -X POST "$API/v1/messages/text" \\
  -H "Authorization: Bearer mrs_live_xxx" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: msg_001" \\
  -d '{"device_id":"...","to":"+9639...","text":"مرحبًا"}'`}
                    />
                </div>
            </section>

            <section id="security" className="marketing-section--surface scroll-mt-24">
                <div className="mx-auto max-w-[var(--content-max-forms)] px-4 py-16 md:px-8 md:py-20">
                    <h2 className="text-h2 text-[rgb(var(--text-primary))]">ضوابط أمنية وتشغيلية</h2>
                    <div className="mt-6 space-y-4">
                        <Alert tone="info" title="موافقة قبل التشغيل">
                            الحسابات تُفعَّل بعد مراجعة إدارية لتقليل إساءة الاستخدام.
                        </Alert>
                        <Alert tone="warning" title="حدود واضحة">
                            لكل خطة حدود أجهزة ورسائل وWebhooks — تُطبَّق من الخادم وليس من الواجهة فقط.
                        </Alert>
                        <Alert tone="neutral" title="الاستخدام المسؤول">
                            الخدمة مخصصة للإشعارات المشروعة للمستلمين الموافقين، ضمن حدود خطتك وسياسة الاستخدام المقبول.
                        </Alert>
                    </div>
                </div>
            </section>

            <section id="pricing" className="marketing-section scroll-mt-24">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-h2 text-[rgb(var(--text-primary))]">خطط واضحة</h2>
                        <p className="mt-2 text-body text-[rgb(var(--muted))]">
                            ابدأ بتجربة مجانية ثم انتقل حسب احتياجك.
                        </p>
                    </div>
                    <LinkButton href="/pricing" variant="outline">
                        تفاصيل الأسعار
                    </LinkButton>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            highlighted={plan.slug === highlightSlug}
                        />
                    ))}
                </div>
            </section>

            <section id="faq" className="marketing-section--surface scroll-mt-24">
                <div className="mx-auto max-w-[var(--content-max-forms)] px-4 py-16 md:px-8 md:py-20">
                    <h2 className="text-h2 text-[rgb(var(--text-primary))]">أسئلة شائعة</h2>
                    <dl className="mt-8 space-y-6">
                        {FAQ.map((item) => (
                            <div key={item.q} className="border-b border-[rgb(var(--border-soft))] pb-6">
                                <dt className="text-h4 text-[rgb(var(--text-primary))]">{item.q}</dt>
                                <dd className="mt-2 text-body text-[rgb(var(--muted))]">{item.a}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="mx-auto max-w-[var(--content-max-forms)] px-4 py-16 md:px-8 md:py-20">
                <div className="marketing-cta">
                    <h2 className="relative z-10 text-h2 text-[rgb(var(--inverse))] sm:text-h1">جاهز لتشغيل إشعاراتك؟</h2>
                    <p className="relative z-10 mx-auto mt-3 max-w-xl text-body text-[rgb(var(--brand-100)/0.9)]">
                        أنشئ حسابًا اليوم، اطلب التجربة المجانية، وابدأ الربط بعد الموافقة.
                    </p>
                    <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
                        <LinkButton href="/register" size="lg" variant="accent">
                            إنشاء حساب
                        </LinkButton>
                        <LinkButton
                            href="/login"
                            size="lg"
                            className="border border-white/20 text-[rgb(var(--inverse))] hover:bg-white/10"
                        >
                            لدي حساب
                        </LinkButton>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
