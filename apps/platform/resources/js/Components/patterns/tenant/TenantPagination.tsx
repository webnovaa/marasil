import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/i18n';

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export function TenantPagination({ pagination }: { pagination: Pagination | null }) {
    const { t } = useI18n();

    if (!pagination || pagination.last_page <= 1) return null;

    const go = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(page));
        router.get(`${window.location.pathname}?${params.toString()}`, {}, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-sm text-[rgb(var(--muted))]">
                {t('pagination.itemsPage', {
                    total: pagination.total,
                    current: pagination.current_page,
                    last: pagination.last_page,
                })}
            </p>
            <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={pagination.current_page <= 1} onClick={() => go(pagination.current_page - 1)}>{t('common.previous')}</Button>
                <Button type="button" variant="secondary" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => go(pagination.current_page + 1)}>{t('common.next')}</Button>
            </div>
        </div>
    );
}

export function applyTenantFilters(filters: Record<string, string>) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v.trim()) params.set(k, v.trim()); });
    const qs = params.toString();
    router.get(qs ? `${window.location.pathname}?${qs}` : window.location.pathname, {}, { preserveState: true, replace: true });
}
