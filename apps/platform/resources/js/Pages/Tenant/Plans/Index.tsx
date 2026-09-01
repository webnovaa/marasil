import { FormEvent, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { CreditCard, FileText, Sparkles } from 'lucide-react';
import { PlanCard, type PublicPlan } from '@/Components/patterns/PlanCard';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import TenantShell from '@/Layouts/TenantShell';
import { isFreePlan, planRequiresApproval } from '@/Lib/plans';

type Props = {
    plans: PublicPlan[];
    has_pending_request: boolean;
};

function flattenErrors(errors: Record<string, string | string[]>): string {
    return Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(Boolean)
        .join(' ');
}

export default function PlansIndex({ plans, has_pending_request }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [customerNote, setCustomerNote] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedPlan && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedPlan]);

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
                type: 'new',
            } as Record<string, string>);

        router.post('/plans/subscribe', body, {
            forceFormData: payload instanceof FormData,
            preserveScroll: !isFreePlan(plan),
            onError: (errors) => {
                setError(flattenErrors(errors) || 'تعذر إرسال طلب الاشتراك');
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
        setPaymentMethod('');
        setPaymentReference('');
        setCustomerNote('');
        setPaymentProof(null);
        setError(null);
    }

    function submitPaidRequest(event: FormEvent) {
        event.preventDefault();

        if (!selectedPlan || has_pending_request) {
            return;
        }

        const formData = new FormData();
        formData.append('plan_id', selectedPlan.id);
        formData.append('type', 'new');

        if (paymentMethod.trim()) {
            formData.append('payment_method', paymentMethod.trim());
        }
        if (paymentReference.trim()) {
            formData.append('payment_reference', paymentReference.trim());
        }
        if (customerNote.trim()) {
            formData.append('customer_note', customerNote.trim());
        }
        if (paymentProof) {
            formData.append('payment_proof', paymentProof);
        }

        subscribe(selectedPlan, formData);
    }

    return (
        <TenantShell
            title="الخطط والأسعار"
            description="اختر الخطة المناسبة. الخطة المجانية تُفعَّل فوراً، والخطط المدفوعة ترسل طلباً للمراجعة."
            width="wide"
        >
            {has_pending_request ? (
                <TenantPanel variant="soft" title="طلب قيد المراجعة">
                    <p className="text-body-sm text-[rgb(var(--warning-text))]">
                        لديك طلب اشتراك قيد المراجعة. لا يمكن إرسال طلب جديد حتى تتم معالجة الطلب الحالي.
                    </p>
                </TenantPanel>
            ) : null}

            {error ? (
                <div className="tenant-alert tenant-alert--danger tenant-alert--stack" role="alert">
                    <p>{error}</p>
                </div>
            ) : null}

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan, index) => {
                    const free = isFreePlan(plan);
                    const isSubmitting = submittingPlanId === plan.id;

                    return (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            highlighted={free || index === 0}
                            selected={selectedPlan?.id === plan.id}
                            ctaLabel={
                                free
                                    ? isSubmitting
                                        ? 'جارٍ التفعيل...'
                                        : 'تفعيل مجاناً الآن'
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

            {selectedPlan && planRequiresApproval(selectedPlan) ? (
                <div ref={formRef}>
                    <TenantPanel
                        title={`إرسال طلب — ${selectedPlan.name}`}
                        description="أرفق مرجع الدفع أو ملاحظة للإدارة. بعد الإرسال يراجع الطلب من لوحة الإدارة."
                    >
                        <form onSubmit={submitPaidRequest} className="space-y-4">
                            <div className="tenant-alert tenant-alert--info tenant-alert--stack">
                                <div className="tenant-alert__content">
                                    <Sparkles className="size-4 shrink-0" aria-hidden />
                                    <p>
                                        هذه خطة مدفوعة. بعد إرسال الطلب ستنتظر موافقة الإدارة قبل تفعيل
                                        الاشتراك.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5 text-sm" htmlFor="payment-method">
                                    <span className="flex items-center gap-1.5 font-medium text-[rgb(var(--text))]">
                                        <CreditCard className="size-4 text-[rgb(var(--muted))]" aria-hidden />
                                        طريقة الدفع
                                    </span>
                                    <Input
                                        id="payment-method"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        placeholder="مثال: تحويل بنكي"
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm" htmlFor="payment-reference">
                                    <span className="font-medium text-[rgb(var(--text))]">مرجع الدفع</span>
                                    <Input
                                        id="payment-reference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="رقم العملية أو المرجع"
                                        dir="ltr"
                                    />
                                </label>
                            </div>

                            <label className="block space-y-1.5 text-sm">
                                <span className="flex items-center gap-1.5 font-medium text-[rgb(var(--text))]">
                                    <FileText className="size-4 text-[rgb(var(--muted))]" aria-hidden />
                                    ملاحظة للإدارة
                                </span>
                                <textarea
                                    className="min-h-24 w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm transition focus:border-[rgb(var(--brand-400))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-200))]"
                                    value={customerNote}
                                    onChange={(e) => setCustomerNote(e.target.value)}
                                    placeholder="أي تفاصيل إضافية..."
                                />
                            </label>

                            <label className="block space-y-1.5 text-sm">
                                <span className="font-medium text-[rgb(var(--text))]">إثبات الدفع (اختياري)</span>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                                    className="block w-full rounded-[var(--radius-md)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] px-3 py-2.5 text-sm text-[rgb(var(--muted))] file:me-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[rgb(var(--brand-100))] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[rgb(var(--brand-800))]"
                                    onChange={(e) => setPaymentProof(e.target.files?.[0] ?? null)}
                                />
                            </label>

                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                    type="submit"
                                    disabled={Boolean(submittingPlanId) || has_pending_request}
                                    className="w-full sm:w-auto"
                                >
                                    {submittingPlanId === selectedPlan.id
                                        ? 'جارٍ الإرسال...'
                                        : 'إرسال طلب للإدارة'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full sm:w-auto"
                                    onClick={() => setSelectedPlan(null)}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </TenantPanel>
                </div>
            ) : null}
        </TenantShell>
    );
}
