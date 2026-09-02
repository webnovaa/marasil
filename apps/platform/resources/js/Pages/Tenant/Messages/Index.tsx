import { FormEvent, useState } from 'react';
import { Link } from '@inertiajs/react';
import { MessageSquare, Search } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { applyTenantFilters, TenantPagination } from '@/Components/patterns/tenant/TenantPagination';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type MessageRow = {
    id: string;
    device_id: string | null;
    to: string;
    type: string;
    status: string;
    queued_at: string | null;
    sent_at: string | null;
    error_code: string | null;
};

type Props = {
    messages: MessageRow[];
    filters: { status: string; search: string };
    pagination: { current_page: number; last_page: number; per_page: number; total: number } | null;
};

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'sent' || status === 'delivered') return 'success';
    if (status === 'failed') return 'danger';
    if (status === 'queued' || status === 'processing') return 'warning';
    return 'neutral';
}

export default function MessagesIndex({ messages, filters, pagination }: Props) {
    const { t, formatDate } = useI18n();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyTenantFilters({ search, status: status === 'all' ? '' : status });
    };

    return (
        <TenantShell title={t('tenant.messages.title')} description={t('tenant.messages.description')}>
            <form onSubmit={onFilter} className="mb-4 flex flex-wrap items-end gap-3">
                <div className="relative min-w-[180px] flex-1">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                    <Input className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('tenant.messages.searchPlaceholder')} dir="ltr" />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {['queued', 'processing', 'sent', 'delivered', 'failed'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button type="submit" variant="secondary">{t('common.apply')}</Button>
            </form>

            <TenantPanel title={t('tenant.messages.listTitle', { count: pagination?.total ?? messages.length })} flush>
                {messages.length === 0 ? (
                    <TenantEmptyState icon={MessageSquare} title={t('tenant.messages.emptyTitle')} description={t('tenant.messages.emptyDescription')} />
                ) : (
                    <ul className="tenant-list">
                        {messages.map((message) => (
                            <li key={message.id} className="tenant-list__item">
                                <div className="min-w-0 flex-1">
                                    <Link href={`/messages/${message.id}`} className="tenant-list__primary hover:underline" dir="ltr">{message.to}</Link>
                                    <p className="tenant-list__secondary">{message.type} · {formatDate(message.queued_at)}</p>
                                    {message.error_code && <p className="text-caption text-[rgb(var(--danger))]">{message.error_code}</p>}
                                </div>
                                <Badge tone={statusTone(message.status)}>{message.status}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="p-4"><TenantPagination pagination={pagination} /></div>
            </TenantPanel>
        </TenantShell>
    );
}
