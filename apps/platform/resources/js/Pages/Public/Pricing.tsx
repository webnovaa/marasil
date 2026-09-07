import { useState } from 'react';
import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';
import {
    annualPriceMinor,
    PlanCard,
    type BillingCycle,
    type PublicPlan,
} from '@/Components/patterns/PlanCard';
import { LinkButton } from '@/Components/ui/LinkButton';
import { cn } from '@/Lib/cn';

type PricingProps = {
    plans: PublicPlan[];
};

const ALL_FEATURES = [
    'ربط أجهزة واتساب',
    'مفتاح إرسال تلقائي مع كل جهاز',
    'إشعارات فشل اختيارية / روابط سيرفر',
    'إرسال عبر طوابير موثوقة',
    'تتبّع حالات الإرسال',
    'لوحة تحكم عربية',
    'دعم فني',
] as const;

export default function Pricing({ plans }: PricingProps) {
    const [billing, setBilling] = useState<BillingCycle>('monthly');
    const highlightSlug = plans.find((p) => p.slug === 'business')?.slug ?? plans[1]?.slug;
    const hasYearly = plans.some((p) => (p.annual_discount_percent ?? 0) > 0);

    return (
        <MarketingLayout>
            <Head title="الأسعار والخطط" />

            <section className="marketing-page-head">
                <div className="marketing-page-head__inner">
                    <p className="marketing-kicker">الأسعار</p>
                    <h1 className="mt-3 text-h1 text-[rgb(var(--text-primary))]">خطط تناسب مرحلة نموك</h1>
                    <p className="mt-3 max-w-2xl text-body-lg text-[rgb(var(--muted))]">
                        تجربة مجانية للانطلاق، ثم خطط مدفوعة بحدود أجهزة ورسائل وWebhooks واضحة. التفعيل بعد موافقة الإدارة.
                    </p>

                    {hasYearly ? (
                        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--canvas))] p-1">
                            {(['monthly', 'yearly'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setBilling(mode)}
                                    className={cn(
                                        'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
                                        billing === mode
                                            ? 'bg-[rgb(var(--brand-700))] text-[rgb(var(--inverse))]'
                                            : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))]',
                                    )}
                                >
                                    {mode === 'monthly' ? 'شهري' : 'سنوي'}
                                    {mode === 'yearly' ? ' (وفّر)' : null}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="mx-auto max-w-[var(--content-max-analytics)] px-4 py-14 md:px-8">
                {plans.length === 0 ? (
                    <p className="text-body text-[rgb(var(--muted))]">لا توجد خطط منشورة حاليًا.</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                highlighted={plan.slug === highlightSlug}
                                billing={billing}
                                ctaHref="/register"
                                ctaLabel={plan.price_minor === 0 ? 'ابدأ التجربة' : 'اختر الخطة'}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="border-y border-[rgb(var(--border-soft))] bg-[rgb(var(--surface))]">
                <div className="mx-auto max-w-[var(--content-max-forms)] px-4 py-16 md:px-8">
                    <h2 className="text-h2 text-[rgb(var(--text-primary))]">المزايا المشتركة في كل الخطط</h2>
                    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                        {ALL_FEATURES.map((feature) => (
                            <li
                                key={feature}
                                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[rgb(var(--border-soft))] bg-[rgb(var(--canvas))] px-4 py-3.5"
                            >
                                <span className="flex size-6 items-center justify-center rounded-full bg-[rgb(var(--brand-600))] text-caption font-semibold text-[rgb(var(--inverse))]">
                                    ✓
                                </span>
                                <span className="text-body text-[rgb(var(--text-primary))]">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <h2 className="mt-16 text-h2 text-[rgb(var(--text-primary))]">مقارنة سريعة للأرقام</h2>
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-start">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-caption text-[rgb(var(--muted))]">
                                    <th className="py-3 pe-4 text-start font-medium">الخطة</th>
                                    <th className="px-4 py-3 text-start font-medium">الأجهزة</th>
                                    <th className="px-4 py-3 text-start font-medium">رسائل / شهر</th>
                                    <th className="px-4 py-3 text-start font-medium">إشعارات سيرفر</th>
                                    <th className="py-3 ps-4 text-start font-medium">السعر السنوي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => {
                                    const annual = annualPriceMinor(plan);
                                    return (
                                        <tr
                                            key={plan.id}
                                            className="border-b border-[rgb(var(--border-soft))] text-body-sm text-[rgb(var(--text-primary))]"
                                        >
                                            <td className="py-4 pe-4 font-semibold text-[rgb(var(--brand-900))]">
                                                {plan.name}
                                            </td>
                                            <td className="px-4 py-4">{plan.max_devices}</td>
                                            <td className="px-4 py-4">{plan.monthly_message_limit.toLocaleString('en-US')}</td>
                                            <td className="px-4 py-4">{plan.max_webhooks}</td>
                                            <td className="py-4 ps-4 font-tabular">
                                                {annual !== null
                                                    ? `$${(annual / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                                    : 'مجانًا'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[var(--content-max-forms)] px-4 py-16 md:px-8">
                <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 text-center">
                    <h2 className="text-h3 text-[rgb(var(--brand-950))]">هل تحتاج حدودًا مخصصة؟</h2>
                    <p className="mx-auto mt-2 max-w-xl text-body text-[rgb(var(--muted))]">
                        تواصل عبر الدعم بعد التسجيل — يمكن للإدارة ضبط خطط إضافية من لوحة التحكم.
                    </p>
                    <LinkButton href="/register" className="mt-6">
                        إنشاء حساب
                    </LinkButton>
                </div>
            </section>
        </MarketingLayout>
    );
}
