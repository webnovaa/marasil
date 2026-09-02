import { Link } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
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
    issued_at: string | null;
};

type Props = {
    invoices: Invoice[];
};

export default function BillingIndex({ invoices }: Props) {
    const { t, locale } = useI18n();

    return (
        <TenantShell title={t('tenant.billing.title')} description={t('tenant.billing.description')}>
            <TenantPanel title={t('tenant.billing.invoices')} flush>
                {invoices.length === 0 ? (
                    <TenantEmptyState
                        icon={CreditCard}
                        title={t('tenant.billing.emptyTitle')}
                        description={t('tenant.billing.emptyDescription')}
                    />
                ) : (
                    <ul className="tenant-list">
                        {invoices.map((invoice) => (
                            <li key={invoice.id} className="tenant-list__item">
                                <div>
                                    <Link href={`/billing/${invoice.id}`} className="tenant-list__primary hover:underline">{invoice.number}</Link>
                                    <p className="tenant-list__secondary">
                                        {(invoice.amount_minor / 100).toLocaleString(locale)} {invoice.currency}
                                    </p>
                                </div>
                                <Badge>{invoice.status}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
