import { Link } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { AdminPagination, useAdminFilters } from '@/Components/patterns/admin/AdminPagination';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { useI18n } from '@/i18n';

type TicketRow = {
    id: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string | null;
    tenant?: { name: string } | null;
    user?: { full_name: string | null; phone_e164: string } | null;
};

type Props = {
    tickets: TicketRow[];
    filters: { search: string; status: string };
    statusOptions: string[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function AdminSupportIndex({ tickets, filters, statusOptions, pagination }: Props) {
    const { t } = useI18n();
    const { applyFilters } = useAdminFilters();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search, status: status === 'all' ? '' : status });
    };

    return (
        <AdminShell title={t('admin.support.title')} description={t('admin.support.description')}>
            <div className="space-y-4">
                <form onSubmit={onFilter} className="admin-panel admin-filter-stack">
                    <div className="admin-filter-field admin-filter-field--search">
                        <label htmlFor="admin-support-search">{t('common.search')}</label>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                            <Input id="admin-support-search" className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.support.searchPlaceholder')} />
                        </div>
                    </div>
                    <div className="admin-filter-field">
                        <label htmlFor="admin-support-status">{t('common.status')}</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="admin-support-status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="admin-filter-actions">
                        <Button type="submit">{t('common.apply')}</Button>
                    </div>
                </form>

                <div className="admin-table-container divide-y divide-[rgb(var(--border))]">
                    {tickets.length === 0 ? (
                        <p className="p-6 text-[rgb(var(--muted))]">{t('admin.support.noTickets')}</p>
                    ) : tickets.map((ticket) => (
                        <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                            <div>
                                <Link href={`/admin/support/${ticket.id}`} className="font-semibold text-[rgb(var(--brand-700))] hover:underline">
                                    {ticket.subject}
                                </Link>
                                <p className="mt-1 text-caption text-[rgb(var(--muted))]">
                                    {ticket.tenant?.name ?? t('common.emDash')} · {ticket.user?.full_name ?? ticket.user?.phone_e164}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge tone={ticket.priority === 'urgent' ? 'danger' : 'neutral'}>{ticket.priority}</Badge>
                                <Badge tone={ticket.status === 'open' ? 'warning' : ticket.status === 'closed' ? 'neutral' : 'info'}>{ticket.status}</Badge>
                                <Link href={`/admin/support/${ticket.id}`}>
                                    <Button size="sm" variant="secondary"><ExternalLink className="size-4" /> {t('common.open')}</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <AdminPagination pagination={pagination} />
            </div>
        </AdminShell>
    );
}
