import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { AdminPagination, useAdminFilters } from '@/Components/patterns/admin/AdminPagination';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/i18n';

type LogRow = {
    id: string;
    action: string;
    subject_type: string | null;
    subject_ulid: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    created_at: string | null;
    actor?: { full_name: string | null; phone_e164: string } | null;
    tenant?: { name: string } | null;
    ip_address?: string | null;
};

type Props = {
    logs: LogRow[];
    filters: { action: string; search: string };
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function AdminAuditIndex({ logs, filters, pagination }: Props) {
    const { t, formatDate } = useI18n();
    const { applyFilters } = useAdminFilters();
    const [action, setAction] = useState(filters.action);
    const [search, setSearch] = useState(filters.search);
    const [expanded, setExpanded] = useState<string | null>(null);

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ action, search });
    };

    return (
        <AdminShell title={t('admin.audit.title')} description={t('admin.audit.description')}>
            <div className="space-y-4">
                <form onSubmit={onFilter} className="admin-panel admin-filter-stack">
                    <div className="admin-filter-field">
                        <label htmlFor="admin-audit-action">{t('admin.audit.actionFilter')}</label>
                        <Input id="admin-audit-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder={t('admin.audit.actionFilter')} />
                    </div>
                    <div className="admin-filter-field">
                        <label htmlFor="admin-audit-search">{t('common.search')}</label>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                            <Input id="admin-audit-search" className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.audit.searchPlaceholder')} />
                        </div>
                    </div>
                    <div className="admin-filter-actions">
                        <Button type="submit">{t('common.apply')}</Button>
                    </div>
                </form>

                <div className="space-y-2">
                    {logs.map((log) => (
                        <div key={log.id} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                            <button type="button" className="w-full text-start" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold">{log.action}</p>
                                        <p className="mt-1 text-caption text-[rgb(var(--muted))]">
                                            {log.actor?.full_name ?? log.actor?.phone_e164 ?? t('admin.audit.system')} · {log.tenant?.name ?? t('common.emDash')} · {formatDate(log.created_at)}
                                        </p>
                                    </div>
                                    <p className="font-mono text-caption" dir="ltr">{log.subject_ulid ?? t('common.emDash')}</p>
                                </div>
                            </button>
                            {expanded === log.id && (
                                <div className="mt-4 grid gap-3 border-t border-[rgb(var(--border))] pt-4 sm:grid-cols-2">
                                    <div>
                                        <p className="mb-1 text-caption font-semibold">{t('admin.audit.before')}</p>
                                        <pre className="overflow-auto rounded bg-[rgb(var(--surface-soft))] p-2 text-xs" dir="ltr">{JSON.stringify(log.before, null, 2)}</pre>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-caption font-semibold">{t('admin.audit.after')}</p>
                                        <pre className="overflow-auto rounded bg-[rgb(var(--surface-soft))] p-2 text-xs" dir="ltr">{JSON.stringify(log.after, null, 2)}</pre>
                                    </div>
                                    {log.ip_address && <p className="text-caption sm:col-span-2" dir="ltr">IP: {log.ip_address}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <AdminPagination pagination={pagination} />
            </div>
        </AdminShell>
    );
}
