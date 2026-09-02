import { FormEvent, useState } from 'react';
import { CalendarPlus, Search, XCircle } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { AdminPagination, useAdminFilters } from '@/Components/patterns/admin/AdminPagination';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Dialog, DialogContent } from '@/Components/ui/Dialog';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type SubRow = {
    id: string;
    plan_name: string;
    status: string;
    ends_at: string | null;
    tenant?: { name: string; slug: string } | null;
    suspension_reason?: string | null;
};

type Props = {
    subscriptions: SubRow[];
    filters: { search: string; status: string };
    statusOptions: string[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

export default function AdminSubscriptionsIndex({ subscriptions, filters, statusOptions, pagination }: Props) {
    const { t, formatDate } = useI18n();
    const { applyFilters } = useAdminFilters();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [extendTarget, setExtendTarget] = useState<SubRow | null>(null);
    const [extendDays, setExtendDays] = useState('30');

    const onFilter = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search, status: status === 'all' ? '' : status });
    };

    const extend = async () => {
        if (!extendTarget) return;
        setBusy(extendTarget.id);
        try {
            await adminPost(`/subscriptions/${extendTarget.id}/extend`, { days: Number(extendDays) });
            setExtendTarget(null);
            applyFilters({ search, status: status === 'all' ? '' : status });
        } catch {
            setError(t('admin.subscriptions.errors.extend'));
        } finally {
            setBusy(null);
        }
    };

    const suspend = async (id: string) => {
        setBusy(id);
        try {
            await adminPost(`/subscriptions/${id}/suspend`, {});
            applyFilters({ search, status: status === 'all' ? '' : status });
        } catch {
            setError(t('admin.subscriptions.errors.suspend'));
        } finally {
            setBusy(null);
        }
    };

    const cancel = async (id: string) => {
        if (!window.confirm(t('admin.subscriptions.cancelConfirm'))) return;
        setBusy(id);
        try {
            await adminPost(`/subscriptions/${id}/cancel`, {});
            applyFilters({ search, status: status === 'all' ? '' : status });
        } catch {
            setError(t('admin.subscriptions.errors.cancel'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminShell title={t('admin.subscriptions.title')} description={t('admin.subscriptions.description')}>
            <div className="space-y-4">
                <form onSubmit={onFilter} className="admin-panel admin-filter-stack">
                    <div className="admin-filter-field admin-filter-field--search">
                        <label htmlFor="admin-subscriptions-search">{t('common.search')}</label>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
                            <Input id="admin-subscriptions-search" className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.subscriptions.searchPlaceholder')} />
                        </div>
                    </div>
                    <div className="admin-filter-field">
                        <label htmlFor="admin-subscriptions-status">{t('common.status')}</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="admin-subscriptions-status"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
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

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">{t('common.account')}</th>
                                <th className="px-4 py-3">{t('common.plan')}</th>
                                <th className="px-4 py-3">{t('common.status')}</th>
                                <th className="px-4 py-3">{t('admin.subscriptions.endsAt')}</th>
                                <th className="px-4 py-3">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id}>
                                    <td className="px-4 py-3">
                                        <p className="admin-table__primary">{sub.tenant?.name ?? t('common.emDash')}</p>
                                        <p className="admin-table__secondary">{sub.tenant?.slug}</p>
                                    </td>
                                    <td className="px-4 py-3">{sub.plan_name}</td>
                                    <td className="px-4 py-3"><Badge tone={sub.status === 'active' ? 'success' : 'neutral'}>{sub.status}</Badge></td>
                                    <td className="px-4 py-3">{formatDate(sub.ends_at, { dateStyle: 'medium', timeStyle: undefined })}</td>
                                    <td className="px-4 py-3">
                                        <div className="admin-table__actions">
                                            {['active', 'expiring', 'grace_period'].includes(sub.status) && (
                                                <Button size="sm" variant="secondary" disabled={busy === sub.id} onClick={() => setExtendTarget(sub)}>
                                                    <CalendarPlus className="size-4" /> {t('admin.subscriptions.extend')}
                                                </Button>
                                            )}
                                            {sub.status !== 'suspended' && sub.status !== 'cancelled' && (
                                                <Button size="sm" variant="outline" disabled={busy === sub.id} onClick={() => void suspend(sub.id)}>{t('common.suspend')}</Button>
                                            )}
                                            {sub.status !== 'cancelled' && (
                                                <Button size="sm" variant="danger" disabled={busy === sub.id} onClick={() => void cancel(sub.id)}>
                                                    <XCircle className="size-4" /> {t('common.cancel')}
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

            <Dialog open={extendTarget !== null} onOpenChange={(open) => !open && setExtendTarget(null)}>
                <DialogContent>
                    <h3 className="text-lg font-bold">{t('admin.subscriptions.extendTitle')}</h3>
                    <FormField id="extend-days" label={t('admin.subscriptions.days')} className="mt-4">
                        <Input type="number" min={1} max={365} value={extendDays} onChange={(e) => setExtendDays(e.target.value)} dir="ltr" />
                    </FormField>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={() => void extend()} disabled={busy !== null}>{t('common.confirm')}</Button>
                        <Button variant="ghost" onClick={() => setExtendTarget(null)}>{t('common.cancel')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminShell>
    );
}
