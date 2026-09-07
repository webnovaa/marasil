import { Check } from 'lucide-react';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { LinkButton } from '@/Components/ui/LinkButton';
import { cn } from '@/Lib/cn';

export type PublicPlan = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_minor: number;
    annual_discount_percent: number | null;
    currency: string;
    duration_days: number;
    max_devices: number;
    monthly_message_limit: number;
    daily_message_limit_per_device: number;
    max_api_keys: number;
    max_webhooks: number;
    max_media_size_mb: number;
    allow_media: boolean;
    allow_priority_queue: boolean;
    allow_team_members: boolean;
    features: string[];
    sort_order: number;
};

export type BillingCycle = 'monthly' | 'yearly';

export function annualPriceMinor(plan: PublicPlan): number | null {
    if (plan.price_minor <= 0) {
        return null;
    }
    const discount = plan.annual_discount_percent ?? 0;
    const discounted = plan.price_minor * 12 * (1 - discount / 100);
    return Math.round(discounted);
}

function formatCurrency(minor: number, currency: string): string {
    const amount = (minor / 100).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${amount}`;
}

function formatPrice(plan: PublicPlan, billing: BillingCycle): string {
    if (plan.price_minor <= 0) {
        return 'مجانًا';
    }
    if (billing === 'yearly') {
        const annual = annualPriceMinor(plan);
        if (annual !== null) {
            return formatCurrency(annual, plan.currency);
        }
    }
    return formatCurrency(plan.price_minor, plan.currency);
}

function billingUnit(plan: PublicPlan, billing: BillingCycle): string {
    if (plan.price_minor <= 0) {
        return `لمدة ${plan.duration_days} يومًا`;
    }
    if (billing === 'yearly') {
        return 'لكامل السنة';
    }
    return `/ ${plan.duration_days} يوم`;
}

function featureLines(plan: PublicPlan): string[] {
    return [
        `${plan.max_devices} جهاز (مفتاح إرسال تلقائي لكل جهاز)`,
        `${plan.monthly_message_limit.toLocaleString('en-US')} رسالة / شهر`,
        `${plan.max_webhooks} رابط إشعارات اختياري`,
        plan.allow_media ? `وسائط حتى ${plan.max_media_size_mb}MB` : 'بدون وسائط',
        plan.allow_team_members ? 'أعضاء فريق' : 'مستخدم واحد',
        plan.allow_priority_queue ? 'طابور أولوية' : 'طابور قياسي',
        `${plan.duration_days} يوم دورة`,
    ];
}

export function PlanCard({
    plan,
    highlighted = false,
    ctaHref = '/register',
    ctaLabel = 'ابدأ الآن',
    onSelect,
    selecting = false,
    disabled = false,
    selected = false,
    billing = 'monthly',
}: {
    plan: PublicPlan;
    highlighted?: boolean;
    ctaHref?: string;
    ctaLabel?: string;
    onSelect?: (plan: PublicPlan) => void;
    selecting?: boolean;
    disabled?: boolean;
    selected?: boolean;
    billing?: BillingCycle;
}) {
    const isTrial = plan.slug === 'free-trial' || plan.price_minor === 0;
    const yearly = billing === 'yearly' && !isTrial;

    return (
        <article
            className={cn(
                'relative flex h-full flex-col rounded-[var(--radius-xl)] border bg-[rgb(var(--surface))] p-6 shadow-[var(--shadow-xs)]',
                selected
                    ? 'border-[rgb(var(--brand-400))] ring-2 ring-[rgb(var(--brand-200))]'
                    : highlighted
                      ? 'border-[rgb(var(--brand-700))] shadow-[var(--shadow-md)] before:absolute before:inset-x-8 before:top-0 before:h-1 before:rounded-b-full before:bg-[rgb(var(--highlight))]'
                      : 'border-[rgb(var(--border))]',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-h3 text-[rgb(var(--brand-950))]">{plan.name}</h3>
                    <p className="mt-1 text-body-sm text-[rgb(var(--muted))]">{plan.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    {isTrial ? <Badge tone="brand">تجريبي</Badge> : null}
                    {highlighted && !isTrial ? <Badge tone="accent">الأكثر طلبًا</Badge> : null}
                    {yearly && (plan.annual_discount_percent ?? 0) > 0 ? (
                        <Badge tone="success">خصم {plan.annual_discount_percent}%</Badge>
                    ) : null}
                </div>
            </div>

            <p className="mt-6 flex flex-wrap items-baseline gap-1 font-tabular">
                <span className="text-display text-[rgb(var(--brand-950))]">{formatPrice(plan, billing)}</span>
                <span className="text-body-sm text-[rgb(var(--muted))]">{billingUnit(plan, billing)}</span>
                {yearly && (plan.annual_discount_percent ?? 0) > 0 ? (
                    <span className="w-full text-caption text-[rgb(var(--subtle))]">
                        {(plan.price_minor * 12).toLocaleString('en-US')} سنويًا قبل الخصم
                    </span>
                ) : null}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5">
                {featureLines(plan).map((line) => (
                    <li key={line} className="flex items-start gap-2 text-body-sm text-[rgb(var(--text))]">
                        <Check className="mt-0.5 size-4 shrink-0 text-[rgb(var(--brand-600))]" aria-hidden />
                        <span>{line}</span>
                    </li>
                ))}
            </ul>

            {onSelect ? (
                <Button
                    type="button"
                    className="mt-8 w-full"
                    variant={highlighted || isTrial ? 'accent' : 'primary'}
                    disabled={disabled || selecting}
                    onClick={() => onSelect(plan)}
                >
                    {selecting ? 'جارٍ الإرسال...' : ctaLabel}
                </Button>
            ) : (
                <LinkButton
                    href={ctaHref}
                    className="mt-8 w-full"
                    variant={highlighted ? 'primary' : 'secondary'}
                >
                    {ctaLabel}
                </LinkButton>
            )}
        </article>
    );
}
