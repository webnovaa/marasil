import { FormEvent, useState } from 'react';
import { Ban, Search } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { AdminPagination, useAdminFilters } from '@/Components/patterns/admin/AdminPagination';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type UserRow = {
    id: string;
    full_name: string | null;
    phone_e164: string;
    status: string;
    company_name?: string | null;
    roles?: string[];
    tenant?: { name: string; status: string } | null;
    created_at?: string;
};

type Props = {
    users: UserRow[];
    filters: { search: string; status: string };
    statusOptions: string[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (status === 'active') return 'success';
    if (status === 'pending_approval' || status === 'pending_phone_verification') return 'warning';
    if (status === 'suspended' || status === 'rejected') return 'danger';
    return 'neutral';
}

export default function AdminUsersIndex({ users, filters, statusOptions, pagination }: Props) {
    const { t } = useI18n();
    const { applyFilters } = useAdminFilters();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
    const [suspendReason, setSuspendReason] = useState('');

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search, status: status === 'all' ? '' : status });
    };

    const suspend = async () => {
        if (!suspendTarget) return;
        setBusy(suspendTarget.id);
        setError(null);
        try {
            await adminPost(`/users/${suspendTarget.id}/suspend`, { reason: suspendReason || null });
            setSuspendTarget(null);
            setSuspendReason('');
            applyFilters({ search, status: status === 'all' ? '' : status });
        } catch {
            setError(t('admin.users.suspendFailed'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminShell title={t('admin.users.title')} description={t('admin.users.description')}>
            <div className="space-y-4">
                <form onSubmit={onFilter} className="admin-panel admin-filter-stack">
                    <div className="admin-filter-field admin-filter-field--search">
                        <label htmlFor="admin-users-search">{t('common.search')}</label>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                            <Input id="admin-users-search" className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.users.searchPlaceholder')} />
                        </div>
                    </div>
                    <div className="admin-filter-field">
                        <label htmlFor="admin-users-status">{t('common.status')}</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="admin-users-status"><SelectValue placeholder={t('common.all')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {statusOptions.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="admin-filter-actions">
                        <Button type="submit">{t('common.apply')}</Button>
                    </div>
                </form>

                {error && <Alert tone="danger">{error}</Alert>}

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.user')}</th>
                                <th className="px-4 py-3 font-semibold">{t('common.account')}</th>
                                <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                                <th className="px-4 py-3 font-semibold">{t('admin.users.roles')}</th>
                                <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {users.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[rgb(var(--muted))]">{t('common.noResults')}</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3">
                                        <p className="admin-table__primary">{user.full_name ?? t('common.emDash')}</p>
                                        <p className="admin-table__secondary" dir="ltr">{user.phone_e164}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="admin-table__primary">{user.tenant?.name ?? user.company_name ?? t('common.emDash')}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge tone={statusTone(user.status)}>{user.status}</Badge>
                                    </td>
                                    <td className="px-4 py-3"><span className="admin-table__secondary">{(user.roles ?? []).join(', ') || t('common.emDash')}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="admin-table__actions">
                                            {user.status !== 'suspended' && (
                                                <Button type="button" variant="danger" size="sm" disabled={busy === user.id} onClick={() => setSuspendTarget(user)}>
                                                    <Ban className="size-4" /> {t('common.suspend')}
                                                </Button>
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

            <ConfirmDialog
                open={suspendTarget !== null}
                onOpenChange={(open) => !open && setSuspendTarget(null)}
                title={t('admin.users.suspendTitle')}
                description={t('admin.users.suspendConfirm', { name: suspendTarget?.full_name ?? suspendTarget?.phone_e164 ?? '' })}
                confirmLabel={t('common.suspend')}
                tone="danger"
                onConfirm={() => void suspend()}
            />
        </AdminShell>
    );
}
