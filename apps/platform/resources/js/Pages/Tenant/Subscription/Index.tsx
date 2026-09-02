import { Clock, CreditCard } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { apiPostForm } from '@/Lib/api-client';
import { Alert } from '@/Components/ui/Alert';
import { Button } from '@/Components/ui/Button';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { LinkButton } from '@/Components/ui/LinkButton';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Subscription = {
    id: string;
    status: string;
    is_usable: boolean;
    plan_name: string;
    plan_slug: string;
    starts_at: string | null;
    ends_at: string | null;
    grace_ends_at: string | null;
    max_devices: number;
    monthly_message_limit: number;
} | null;

type RequestItem = {
    id: string;
    type: string;
    status: string;
    created_at: string | null;
    plan: { name: string } | null;
};

type Props = {
    subscription: Subscription;
    requests: RequestItem[];
};

function requestStatusTone(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
    if (status === 'pending') return 'warning';
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'neutral';
}

export default function SubscriptionIndex({ subscription, requests }: Props) {
    const { t, formatDate, locale } = useI18n();
    const pendingRequest = requests.find((item) => item.status === 'pending');
    const [showRenewal, setShowRenewal] = useState(false);
    const [renewalNote, setRenewalNote] = useState('');
    const [paymentRef, setPaymentRef] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [renewalBusy, setRenewalBusy] = useState(false);
    const [renewalError, setRenewalError] = useState<string | null>(null);
    const [renewalSuccess, setRenewalSuccess] = useState(false);

    function statusLabel(status: string): string {
        const key = `tenant.subscription.statuses.${status}`;
        const label = t(key);
        return label === key ? status : label;
    }

    async function submitRenewal(e: FormEvent) {
        e.preventDefault();
        setRenewalBusy(true);
        setRenewalError(null);
        const form = new FormData();
        if (paymentRef) form.append('payment_reference', paymentRef);
        if (renewalNote) form.append('customer_note', renewalNote);
        if (paymentProof) form.append('payment_proof', paymentProof);
        try {
            const res = await apiPostForm('/subscription/renewal-request', form);
            if (res.success) {
                setRenewalSuccess(true);
                setShowRenewal(false);
                router.reload({ only: ['requests'] });
            } else {
                setRenewalError(res.error?.message ?? t('tenant.subscription.errors.submit'));
            }
        } catch {
            setRenewalError(t('tenant.subscription.errors.renewalSubmit'));
        } finally {
            setRenewalBusy(false);
        }
    }

    return (
        <TenantShell
            title={t('tenant.subscription.title')}
            description={t('tenant.subscription.description')}
            headerActions={
                subscription?.is_usable ? (
                    <LinkButton href="/plans" variant="secondary" size="sm">
                        {t('tenant.subscription.upgradePlan')}
                    </LinkButton>
                ) : (
                    <LinkButton href="/plans" size="sm">
                        {t('tenant.subscription.choosePlan')}
                    </LinkButton>
                )
            }
        >
            {!subscription && !pendingRequest ? (
                <TenantPanel variant="soft">
                    <TenantEmptyState
                        icon={CreditCard}
                        title={t('tenant.subscription.noActiveTitle')}
                        description={t('tenant.subscription.noActiveDescription')}
                        action={
                            <LinkButton href="/plans" className="mt-2">
                                {t('tenant.subscription.choosePlan')}
                            </LinkButton>
                        }
                    />
                </TenantPanel>
            ) : null}

            {pendingRequest && !subscription?.is_usable ? (
                <TenantPanel variant="soft" title={t('tenant.subscription.pendingRequest')}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-body-sm text-[rgb(var(--text))]">
                                {t('tenant.subscription.pendingText', { plan: pendingRequest.plan?.name ?? t('common.emDash') })}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-caption text-[rgb(var(--subtle))]">
                                <Clock className="size-3.5" aria-hidden />
                                {formatDate(pendingRequest.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                        <Badge tone="warning">{statusLabel('pending')}</Badge>
                    </div>
                </TenantPanel>
            ) : null}

            {subscription ? (
                <TenantPanel
                    title={subscription.plan_name}
                    description={t('tenant.subscription.currentDetails')}
                    action={
                        <Badge tone={subscription.is_usable ? 'success' : 'warning'}>
                            {statusLabel(subscription.status)}
                        </Badge>
                    }
                >
                    <dl className="tenant-detail-grid">
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.startsAt')}</dt>
                            <dd>{formatDate(subscription.starts_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.endsAt')}</dt>
                            <dd>{formatDate(subscription.ends_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.graceEndsAt')}</dt>
                            <dd>{formatDate(subscription.grace_ends_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.isUsable')}</dt>
                            <dd>{subscription.is_usable ? t('common.yes') : t('common.no')}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.devices')}</dt>
                            <dd>{subscription.max_devices}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>{t('tenant.subscription.monthlyMessages')}</dt>
                            <dd>{subscription.monthly_message_limit.toLocaleString(locale)}</dd>
                        </div>
                    </dl>
                    {!subscription.is_usable ? (
                        <LinkButton href="/plans" variant="secondary" className="mt-5 w-full sm:w-auto">
                            {t('tenant.subscription.renewOrUpgrade')}
                        </LinkButton>
                    ) : (
                        <Button type="button" variant="secondary" className="mt-5" onClick={() => setShowRenewal(true)}>
                            {t('tenant.subscription.requestRenewal')}
                        </Button>
                    )}
                </TenantPanel>
            ) : null}

            {renewalSuccess && <Alert tone="success" className="mb-4">{t('tenant.subscription.renewalSuccess')}</Alert>}
            {renewalError && <Alert tone="danger" className="mb-4">{renewalError}</Alert>}

            {showRenewal && (
                <TenantPanel title={t('tenant.subscription.renewalRequest')} className="mb-4">
                    <form onSubmit={submitRenewal} className="space-y-3">
                        <FormField id="renewal-payment-ref" label={t('tenant.subscription.paymentReference')}><Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} dir="ltr" /></FormField>
                        <FormField id="renewal-note" label={t('common.note')}><Textarea value={renewalNote} onChange={(e) => setRenewalNote(e.target.value)} rows={3} /></FormField>
                        <FormField id="renewal-proof" label={t('tenant.subscription.paymentProof')}><Input type="file" accept="image/*,.pdf" onChange={(e) => setPaymentProof(e.target.files?.[0] ?? null)} /></FormField>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={renewalBusy}>{renewalBusy ? t('tenant.subscription.submitting') : t('tenant.subscription.submitRequest')}</Button>
                            <Button type="button" variant="ghost" onClick={() => setShowRenewal(false)}>{t('common.cancel')}</Button>
                        </div>
                    </form>
                </TenantPanel>
            )}

            <TenantPanel title={t('tenant.subscription.requestHistory')} flush>
                {requests.length === 0 ? (
                    <TenantEmptyState
                        icon={Clock}
                        title={t('tenant.subscription.noRequestsTitle')}
                        description={t('tenant.subscription.noRequestsDescription')}
                    />
                ) : (
                    <ul className="tenant-list">
                        {requests.map((item) => (
                            <li key={item.id} className="tenant-list__item">
                                <div className="min-w-0">
                                    <p className="tenant-list__primary">{item.plan?.name ?? t('common.plan')}</p>
                                    <p className="tenant-list__secondary">
                                        {statusLabel(item.type)} · {formatDate(item.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <Badge tone={requestStatusTone(item.status)}>{statusLabel(item.status)}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
