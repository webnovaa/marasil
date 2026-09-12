import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Check,
    Copy,
    Download,
    ExternalLink,
    Eye,
    FileText,
    ShieldCheck,
    X,
} from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type RequestItem = {
    id: string;
    type: string;
    status: string;
    billing_cycle?: string;
    amount_minor?: number;
    formatted_amount?: string;
    currency?: string;
    created_at: string | null;
    customer_note: string | null;
    has_payment_proof: boolean;
    payment_reference?: string | null;
    payment_method?: string | null;
    plan: { name: string; price_minor: number; currency: string } | null;
    tenant: { name: string; slug: string } | null;
    requested_by: { full_name: string | null; phone_e164: string } | null;
};

type Props = {
    requests: RequestItem[];
};

export default function AdminSubscriptionRequestsIndex({ requests: initial }: Props) {
    const { t, formatDate } = useI18n();
    const [requests, setRequests] = useState(initial);
    const [busy, setBusy] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewProofRequest, setPreviewProofRequest] = useState<RequestItem | null>(null);
    const [copiedRef, setCopiedRef] = useState<string | null>(null);

    async function handleCopy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedRef(text);
            setTimeout(() => setCopiedRef(null), 2000);
        } catch {
            setCopiedRef(null);
        }
    }

    async function approve(id: string) {
        setBusy(id);
        setError(null);
        try {
            await adminPost(`/subscription-requests/${id}/approve`, {});
            setRequests((prev) => prev.filter((item) => item.id !== id));
            if (previewProofRequest?.id === id) {
                setPreviewProofRequest(null);
            }
            router.reload({ only: ['requests'] });
        } catch {
            setError(t('admin.subscriptionRequests.errors.approve'));
        } finally {
            setBusy(null);
        }
    }

    async function reject(id: string) {
        if (reason.trim().length < 3) {
            setError(t('admin.subscriptionRequests.errors.rejectShort'));
            return;
        }

        setBusy(id);
        setError(null);
        try {
            await adminPost(`/subscription-requests/${id}/reject`, { reason: reason.trim() });
            setRequests((prev) => prev.filter((item) => item.id !== id));
            setRejecting(null);
            setReason('');
            if (previewProofRequest?.id === id) {
                setPreviewProofRequest(null);
            }
            router.reload({ only: ['requests'] });
        } catch {
            setError(t('admin.subscriptionRequests.errors.reject'));
        } finally {
            setBusy(null);
        }
    }

    return (
        <AdminShell
            title={t('admin.subscriptionRequests.title')}
            description={t('admin.subscriptionRequests.description')}
        >
            <div className="admin-panel p-4 sm:p-5 lg:p-6">
                {error ? <p className="mb-4 text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                <ul className="space-y-4">
                    {requests.length === 0 ? (
                        <li className="admin-panel--soft rounded-[var(--radius-lg)] p-5 text-[rgb(var(--muted))] sm:p-6">
                            {t('admin.subscriptionRequests.noPending')}
                        </li>
                    ) : (
                        requests.map((item) => {
                            const isYearly = item.billing_cycle === 'yearly';
                            const amount = item.formatted_amount ?? (item.plan ? (item.plan.price_minor / 100).toFixed(2) : '0.00');

                            return (
                                <li
                                    key={item.id}
                                    className="admin-panel--soft rounded-[var(--radius-lg)] border border-[rgb(var(--border))] p-4 sm:p-5 shadow-xs transition hover:border-[rgb(var(--border-strong))]"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-black text-[rgb(var(--brand-900))] sm:text-lg">
                                                    {item.tenant?.name ?? t('common.company')}
                                                </h2>
                                                <span className="text-xs text-[rgb(var(--muted))]">
                                                    ({item.tenant?.slug})
                                                </span>
                                            </div>
                                            <p className="mt-1 text-body-sm text-[rgb(var(--muted))]">
                                                {item.plan?.name ?? t('common.plan')} · {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {isYearly ? (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                                    اشتراك سنوي (سنة كاملة)
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                                                    اشتراك شهري
                                                </span>
                                            )}
                                            <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-extrabold text-white">
                                                ${amount} {item.currency ?? 'USD'}
                                            </span>
                                            <span className="rounded-full bg-[rgb(var(--warning-bg))] px-2.5 py-1 text-caption font-bold text-[rgb(var(--warning))]">
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <dt className="text-xs text-[var(--text-muted)]">{t('admin.subscriptionRequests.requestedBy')}</dt>
                                            <dd className="font-semibold text-xs mt-0.5">
                                                {item.requested_by?.full_name ?? item.requested_by?.phone_e164 ?? t('common.emDash')}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs text-[var(--text-muted)]">طريقة الدفع</dt>
                                            <dd className="font-semibold text-xs mt-0.5">
                                                {item.payment_method ?? 'غير محدد'}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs text-[var(--text-muted)]">{t('admin.subscriptionRequests.paymentReference')}</dt>
                                            <dd className="flex items-center gap-1 font-mono text-xs font-semibold mt-0.5" dir="ltr">
                                                {item.payment_reference ? (
                                                    <>
                                                        <span className="truncate max-w-36">{item.payment_reference}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleCopy(item.payment_reference!)}
                                                            className="text-[rgb(var(--brand-700))] hover:text-[rgb(var(--brand-900))]"
                                                            title="نسخ المرجع"
                                                        >
                                                            {copiedRef === item.payment_reference ? (
                                                                <Check className="size-3 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-3" />
                                                            )}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[rgb(var(--muted))]">لا يوجد</span>
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs text-[var(--text-muted)]">{t('admin.subscriptionRequests.paymentProof')}</dt>
                                            <dd className="mt-0.5">
                                                {item.has_payment_proof ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs gap-1 text-[rgb(var(--brand-700))]"
                                                        onClick={() => setPreviewProofRequest(item)}
                                                    >
                                                        <Eye className="size-3.5" />
                                                        معاينة وفحص الوصل
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-[rgb(var(--muted))]">
                                                        {t('admin.subscriptionRequests.notAttached')}
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>

                                    {item.customer_note ? (
                                        <div className="mt-3 rounded-lg bg-[rgb(var(--surface))] p-2.5 text-xs text-[var(--text-muted)] border border-[rgb(var(--border))]">
                                            <span className="font-bold text-[rgb(var(--text))]">ملاحظة العميل: </span>
                                            {item.customer_note}
                                        </div>
                                    ) : null}

                                    {rejecting === item.id ? (
                                        <div className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
                                            <label className="block text-sm" htmlFor={`reject-reason-${item.id}`}>
                                                <span className="font-bold text-xs text-red-900">
                                                    {t('admin.subscriptionRequests.rejectReason')}
                                                </span>
                                                <textarea
                                                    id={`reject-reason-${item.id}`}
                                                    className="mt-1.5 min-h-20 w-full rounded-[var(--radius-md)] border border-red-300 bg-white px-3 py-2 text-xs"
                                                    placeholder="سبب الرفض الذي سيظهر للعميل..."
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                    required
                                                />
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    disabled={busy === item.id}
                                                    onClick={() => void reject(item.id)}
                                                >
                                                    {t('admin.subscriptionRequests.confirmReject')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setRejecting(null);
                                                        setReason('');
                                                    }}
                                                >
                                                    {t('common.cancel')}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border))] pt-3">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                disabled={busy === item.id}
                                                onClick={() => void approve(item.id)}
                                            >
                                                <ShieldCheck className="size-4 me-1" />
                                                الموافقة وتفعيل الاشتراك
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={busy === item.id}
                                                onClick={() => setRejecting(item.id)}
                                            >
                                                {t('common.reject')}
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>

            {/* Modal for Payment Proof Inspection */}
            {previewProofRequest ? (
                <Dialog
                    open={Boolean(previewProofRequest)}
                    onOpenChange={(open) => {
                        if (!open) setPreviewProofRequest(null);
                    }}
                >
                    <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-5 sm:p-6">
                        <DialogHeader className="border-b border-[rgb(var(--border))] pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <DialogTitle className="text-lg font-black text-[rgb(var(--brand-950))]">
                                        تدقيق وصل الدفع — {previewProofRequest.tenant?.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-[rgb(var(--muted))]">
                                        الخطة: {previewProofRequest.plan?.name} · {previewProofRequest.billing_cycle === 'yearly' ? 'اشتراك سنوي (365 يوم)' : 'اشتراك شهري (30 يوم)'}
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/admin/v1/subscription-requests/${previewProofRequest.id}/payment-proof`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--brand-700))] hover:bg-[rgb(var(--surface-soft))]"
                                    >
                                        <ExternalLink className="size-3.5" />
                                        فتح بنافذة جديدة
                                    </a>
                                    <a
                                        href={`/api/admin/v1/subscription-requests/${previewProofRequest.id}/payment-proof?download=1`}
                                        className="inline-flex items-center gap-1 rounded-lg bg-[rgb(var(--brand-700))] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[rgb(var(--brand-800))]"
                                    >
                                        <Download className="size-3.5" />
                                        تحميل الوصل
                                    </a>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Summary Bar */}
                        <div className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-3 text-xs">
                            <div>
                                <span className="text-[rgb(var(--muted))]">طريقة الدفع: </span>
                                <span className="font-bold">{previewProofRequest.payment_method ?? 'يدوي'}</span>
                            </div>
                            <div>
                                <span className="text-[rgb(var(--muted))]">مرجع الدفع: </span>
                                <span className="font-mono font-bold" dir="ltr">
                                    {previewProofRequest.payment_reference ?? 'غير مرفق'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[rgb(var(--muted))]">المبلغ المستحق: </span>
                                <span className="font-bold text-emerald-700">
                                    ${previewProofRequest.formatted_amount ?? '0.00'}
                                </span>
                            </div>
                        </div>

                        {/* Image Viewer */}
                        <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-slate-950 p-2">
                            <img
                                src={`/api/admin/v1/subscription-requests/${previewProofRequest.id}/payment-proof`}
                                alt="وصل التحويل"
                                className="max-h-[50vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                            />
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[rgb(var(--border))] pt-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewProofRequest(null)}
                            >
                                إغلاق
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={busy === previewProofRequest.id}
                                onClick={() => {
                                    setRejecting(previewProofRequest.id);
                                    setPreviewProofRequest(null);
                                }}
                            >
                                رفض الطلب
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                disabled={busy === previewProofRequest.id}
                                onClick={() => void approve(previewProofRequest.id)}
                            >
                                <ShieldCheck className="size-4 me-1" />
                                اعتماد وتفعيل فوراً
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            ) : null}
        </AdminShell>
    );
}
