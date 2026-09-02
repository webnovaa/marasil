import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminShell from '@/Layouts/AdminShell';
import { Button } from '@/Components/ui/Button';
import { adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type RequestItem = {
    id: string;
    type: string;
    status: string;
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

    async function approve(id: string) {
        setBusy(id);
        setError(null);
        try {
            await adminPost(`/subscription-requests/${id}/approve`, {});
            setRequests((prev) => prev.filter((item) => item.id !== id));
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
            router.reload({ only: ['requests'] });
        } catch {
            setError(t('admin.subscriptionRequests.errors.reject'));
        } finally {
            setBusy(null);
        }
    }

    return (
        <AdminShell title={t('admin.subscriptionRequests.title')} description={t('admin.subscriptionRequests.description')}>
            <div className="admin-panel p-4 sm:p-5 lg:p-6">
                {error ? <p className="mb-4 text-sm text-[rgb(var(--danger))]">{error}</p> : null}
                <ul className="space-y-3 sm:space-y-4">
                    {requests.length === 0 ? (
                        <li className="admin-panel--soft rounded-[var(--radius-lg)] p-5 text-[rgb(var(--muted))] sm:p-6">
                            {t('admin.subscriptionRequests.noPending')}
                        </li>
                    ) : (
                        requests.map((item) => (
                            <li
                                key={item.id}
                                className="admin-panel--soft rounded-[var(--radius-lg)] p-4 sm:p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-extrabold text-[rgb(var(--brand-900))] sm:text-lg">
                                            {item.tenant?.name ?? t('common.company')}
                                        </h2>
                                        <p className="mt-1 text-body-sm text-[rgb(var(--muted))] sm:text-body">
                                            {item.plan?.name ?? t('common.plan')} · {item.type} · {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[rgb(var(--warning-bg))] px-3 py-1 text-caption font-bold text-[rgb(var(--warning))]">
                                        {item.status}
                                    </span>
                                </div>
                                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                                    <div>
                                        <dt className="text-[var(--text-muted)]">{t('admin.subscriptionRequests.requestedBy')}</dt>
                                        <dd className="font-medium">
                                            {item.requested_by?.full_name ?? item.requested_by?.phone_e164 ?? t('common.emDash')}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-[var(--text-muted)]">{t('admin.subscriptionRequests.paymentProof')}</dt>
                                        <dd className="font-medium">
                                            {item.has_payment_proof ? (
                                                <a
                                                    href={`/api/admin/v1/subscription-requests/${item.id}/payment-proof`}
                                                    className="text-[rgb(var(--brand-700))] hover:underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {t('admin.subscriptionRequests.viewDownload')}
                                                </a>
                                            ) : t('admin.subscriptionRequests.notAttached')}
                                        </dd>
                                    </div>
                                    {item.payment_reference ? (
                                        <div>
                                            <dt className="text-[var(--text-muted)]">{t('admin.subscriptionRequests.paymentReference')}</dt>
                                            <dd className="font-medium" dir="ltr">{item.payment_reference}</dd>
                                        </div>
                                    ) : null}
                                </dl>
                                {item.customer_note ? (
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                        {item.customer_note}
                                    </p>
                                ) : null}

                                {rejecting === item.id ? (
                                    <div className="mt-4 space-y-3">
                                        <label className="block text-sm" htmlFor={`reject-reason-${item.id}`}>
                                            <span className="font-medium">{t('admin.subscriptionRequests.rejectReason')}</span>
                                            <textarea
                                                id={`reject-reason-${item.id}`}
                                                className="mt-1.5 min-h-20 w-full rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="danger"
                                                disabled={busy === item.id}
                                                onClick={() => void reject(item.id)}
                                            >
                                                {t('admin.subscriptionRequests.confirmReject')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
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
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            disabled={busy === item.id}
                                            onClick={() => void approve(item.id)}
                                        >
                                            {t('common.approve')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={busy === item.id}
                                            onClick={() => setRejecting(item.id)}
                                        >
                                            {t('common.reject')}
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </AdminShell>
    );
}
