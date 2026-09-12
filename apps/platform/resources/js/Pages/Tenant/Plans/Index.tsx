import { useState } from 'react';
import { router } from '@inertiajs/react';
import { PlanCard, type BillingCycle, type PublicPlan } from '@/Components/patterns/PlanCard';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { ManualPaymentModal, type ManualPaymentMethod } from '@/Components/patterns/tenant/ManualPaymentModal';
import TenantShell from '@/Layouts/TenantShell';
import { isFreePlan } from '@/Lib/plans';
import { cn } from '@/Lib/cn';

type Props = {
    plans: PublicPlan[];
    has_pending_request: boolean;
    payment_methods: ManualPaymentMethod[];
};

function flattenErrors(errors: Record<string, string | string[]>): string {
    return Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(Boolean)
        .join(' ');
}

export default function PlansIndex({ plans, has_pending_request, payment_methods }: Props) {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function subscribe(plan: PublicPlan, payload?: FormData) {
        if (has_pending_request) {
            return;
        }

        setError(null);
        setSubmittingPlanId(plan.id);

        const body =
            payload ??
            ({
                plan_id: plan.id,
                billing_cycle: billingCycle,
                type: 'new',
            } as Record<string, string>);

        router.post('/plans/subscribe', body, {
            forceFormData: payload instanceof FormData,
            preserveScroll: !isFreePlan(plan),
            onError: (errors) => {
                setError(flattenErrors(errors) || 'تعذر إرسال طلب الاشتراك');
            },
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                setSelectedPlan(null);
            },
            onFinish: () => {
                setSubmittingPlanId(null);
            },
        });
    }

    function handlePlanSelect(plan: PublicPlan) {
        if (has_pending_request || submittingPlanId) {
            return;
        }

        if (isFreePlan(plan)) {
            subscribe(plan);
            return;
        }

        setSelectedPlan(plan);
        setError(null);
        setIsPaymentModalOpen(true);
    }

    return (
        <TenantShell
            title="الخطط والاشتراكات الرسمية"
            description="اختر الخطة التي تناسب حجم أعمالك. نوفر اشتراكات شهرية وسنوية مع خصم 20%، وطرق دفع محلية ودولية متعددة."
            width="wide"
        >
            {has_pending_request ? (
                <TenantPanel variant="soft" title="طلب اشتراك قيد المراجعة">
                    <p className="text-body-sm text-[rgb(var(--warning-text))]">
                        لديك طلب اشتراك حالي قيد مراجعة الإدارة. سنقوم بتأكيد وتفعيل باقتك فور التحقق من إشعار الدفع المرفق.
                    </p>
                </TenantPanel>
            ) : null}

            {error ? (
                <div className="tenant-alert tenant-alert--danger tenant-alert--stack" role="alert">
                    <p>{error}</p>
                </div>
            ) : null}

            {/* Billing Cycle Switcher */}
            <div className="my-6 flex items-center justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 shadow-xs">
                    <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={cn(
                            'rounded-full px-5 py-2 text-sm font-bold transition',
                            billingCycle === 'monthly'
                                ? 'bg-[rgb(var(--brand-600))] text-white shadow-sm'
                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                        )}
                    >
                        دفع شهري مرن
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={cn(
                            'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition',
                            billingCycle === 'yearly'
                                ? 'bg-[rgb(var(--brand-600))] text-white shadow-sm'
                                : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                        )}
                    >
                        <span>اشتراك سنوي</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                            وفر 20% 🎉
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
                {plans.map((plan, index) => {
                    const free = isFreePlan(plan);
                    const isSubmitting = submittingPlanId === plan.id;

                    return (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            billing={billingCycle}
                            highlighted={plan.slug === 'business' || index === 2}
                            selected={selectedPlan?.id === plan.id}
                            ctaLabel={
                                free
                                    ? isSubmitting
                                        ? 'جارٍ التفعيل...'
                                        : 'تفعيل تجريبي مجاناً'
                                    : isSubmitting
                                      ? 'جارٍ الإرسال...'
                                      : 'اختيار هذه الخطة'
                            }
                            onSelect={handlePlanSelect}
                            selecting={isSubmitting}
                            disabled={has_pending_request || (submittingPlanId !== null && !isSubmitting)}
                        />
                    );
                })}
            </div>

            {/* Luxury Manual Payment Modal */}
            <ManualPaymentModal
                open={isPaymentModalOpen}
                onOpenChange={(open) => {
                    setIsPaymentModalOpen(open);
                    if (!open) setSelectedPlan(null);
                }}
                plan={selectedPlan}
                billingCycle={billingCycle}
                onBillingCycleChange={setBillingCycle}
                onSubmit={(formData) => {
                    if (selectedPlan) {
                        subscribe(selectedPlan, formData);
                    }
                }}
                submitting={submittingPlanId === selectedPlan?.id}
                error={error}
                methods={payment_methods ?? []}
            />
        </TenantShell>
    );
}
