import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { AdminPagination, useAdminFilters } from '@/Components/patterns/admin/AdminPagination';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { adminPatch } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type TenantRow = {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner?: { full_name: string | null; phone_e164: string } | null;
};

type Props = {
    tenants: TenantRow[];
    filters: { search: string; status: string };
    statusOptions: string[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function AdminTenantsIndex({ tenants, filters, statusOptions, pagination }: Props) {
    const { t } = useI18n();
    const { applyFilters } = useAdminFilters();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search, status: status === 'all' ? '' : status });
    };

    const updateStatus = async (tenantId: string, newStatus: string) => {
        setBusy(tenantId);
        setError(null);
        setSuccess(null);
        try {
            await adminPatch(`/tenants/${tenantId}/status`, { status: newStatus });
            setSuccess(t('admin.tenants.statusUpdated'));
            applyFilters({ search, status: status === 'all' ? '' : status });
        } catch {
            setError(t('admin.tenants.updateFailed'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminShell title={t('admin.tenants.title')} description={t('admin.tenants.description')}>
            <div className="space-y-4">
                <form onSubmit={onFilter} className="admin-panel admin-filter-stack">
                    <div className="admin-filter-field admin-filter-field--search">
                        <label htmlFor="admin-tenants-search">{t('common.search')}</label>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                            <Input id="admin-tenants-search" className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.tenants.searchPlaceholder')} />
                        </div>
                    </div>
                    <div className="admin-filter-field">
                        <label htmlFor="admin-tenants-status">{t('common.status')}</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="admin-tenants-status"><SelectValue /></SelectTrigger>
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

                {error && <Alert tone="danger">{error}</Alert>}
                {success && <Alert tone="success">{success}</Alert>}

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">{t('common.account')}</th>
                                <th className="px-4 py-3">{t('admin.tenants.owner')}</th>
                                <th className="px-4 py-3">{t('common.status')}</th>
                                <th className="px-4 py-3">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-[rgb(var(--muted))]">
                                        {t('common.noResults')}
                                    </td>
                                </tr>
                            ) : tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="px-4 py-3">
                                        <p className="admin-table__primary">{tenant.name}</p>
                                        <p className="admin-table__secondary">{tenant.slug}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="admin-table__primary">{tenant.owner?.full_name ?? t('common.emDash')}</p>
                                        <p className="admin-table__secondary" dir="ltr">{tenant.owner?.phone_e164}</p>
                                    </td>
                                    <td className="px-4 py-3"><Badge tone={tenant.status === 'active' ? 'success' : 'warning'}>{tenant.status}</Badge></td>
                                    <td className="px-4 py-3">
                                        <div className="admin-table__actions">
                                            {tenant.status !== 'active' && (
                                                <Button size="sm" variant="secondary" disabled={busy === tenant.id} onClick={() => void updateStatus(tenant.id, 'active')}>{t('common.activate')}</Button>
                                            )}
                                            {tenant.status !== 'suspended' && (
                                                <Button size="sm" variant="outline" disabled={busy === tenant.id} onClick={() => void updateStatus(tenant.id, 'suspended')}>{t('common.suspend')}</Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <AdminPagination pagination={pagination} />
            </div>
        </AdminShell>
    );
}
