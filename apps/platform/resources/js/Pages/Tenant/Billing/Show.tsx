import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Invoice = {
    id: string;
    number: string;
    status: string;
    amount_minor: number;
    currency: string;
    payment_method: string | null;
    payment_reference: string | null;
    issued_at: string | null;
    paid_at: string | null;
    items: { description: string; amount_minor: number; quantity: number }[];
};

export default function BillingShow({ invoice }: { invoice: Invoice }) {
    const { t, formatDate, locale } = useI18n();

    return (
        <TenantShell title={t('tenant.billing.showTitle', { number: invoice.number })} description={t('tenant.billing.showDescription')}>
            <Link href="/billing" className="mb-4 inline-flex items-center gap-1 text-sm text-[rgb(var(--brand-700))] hover:underline">
                <ArrowRight className="size-4" /> {t('common.back')}
            </Link>

            <TenantPanel title={invoice.number} action={<Badge>{invoice.status}</Badge>}>
                <dl className="tenant-detail-grid">
                    <div className="tenant-detail-item"><dt>{t('common.amount')}</dt><dd>{(invoice.amount_minor / 100).toLocaleString(locale)} {invoice.currency}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.billing.issuedAt')}</dt><dd>{formatDate(invoice.issued_at, { dateStyle: 'medium' })}</dd></div>
                    <div className="tenant-detail-item"><dt>{t('tenant.billing.paidAt')}</dt><dd>{formatDate(invoice.paid_at, { dateStyle: 'medium' })}</dd></div>
                    {invoice.payment_method && <div className="tenant-detail-item"><dt>{t('tenant.billing.paymentMethod')}</dt><dd>{invoice.payment_method}</dd></div>}
                    {invoice.payment_reference && <div className="tenant-detail-item"><dt>{t('tenant.billing.paymentReference')}</dt><dd dir="ltr">{invoice.payment_reference}</dd></div>}
                </dl>
            </TenantPanel>

            {invoice.items.length > 0 && (
                <TenantPanel title={t('tenant.billing.lineItems')} className="mt-4" flush>
                    <table className="w-full text-sm">
                        <thead className="border-b bg-[rgb(var(--surface-soft))] text-start">
                            <tr><th className="px-4 py-2">{t('tenant.billing.descriptionCol')}</th><th className="px-4 py-2">{t('tenant.billing.quantity')}</th><th className="px-4 py-2">{t('common.amount')}</th></tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i} className="border-b border-[rgb(var(--border-soft))]">
                                    <td className="px-4 py-3">{item.description}</td>
                                    <td className="px-4 py-3">{item.quantity}</td>
                                    <td className="px-4 py-3">{(item.amount_minor / 100).toLocaleString(locale)} {invoice.currency}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TenantPanel>
            )}
        </TenantShell>
    );
}
