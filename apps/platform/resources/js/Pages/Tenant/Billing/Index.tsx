import { CreditCard } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
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
    return (
        <TenantShell title="الفوترة" description="فواتير يدوية وإثبات دفع. لا بوابة بطاقات في الإصدار الحالي.">
            <TenantPanel title="الفواتير" flush>
                {invoices.length === 0 ? (
                    <TenantEmptyState
                        icon={CreditCard}
                        title="لا فواتير بعد"
                        description="تصدر الفواتير عند الموافقة على خطة مدفوعة من الإدارة."
                    />
                ) : (
                    <ul className="tenant-list">
                        {invoices.map((invoice) => (
                            <li key={invoice.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{invoice.number}</p>
                                    <p className="tenant-list__secondary">
                                        {(invoice.amount_minor / 100).toLocaleString('ar')} {invoice.currency}
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
