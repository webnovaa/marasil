import { FormEvent, useEffect, useState } from 'react';
import { History, Pencil, Plus, RefreshCw, Trash2, Webhook } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { Dialog, DialogContent } from '@/Components/ui/Dialog';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/Lib/api-client';

type WebhookRow = {
    id: string;
    name: string;
    url: string;
    subscribed_events: string[];
    status: string;
    secret?: string;
    failure_count?: number;
};

type Delivery = {
    id: string;
    event_type: string;
    status: string;
    response_status: number | null;
    duration_ms: number | null;
    created_at: string | null;
};


export default function WebhooksIndex() {
    const { t, formatDate } = useI18n();
    const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
    const [name, setName] = useState('Production webhook');
    const [url, setUrl] = useState('https://example.com/webhooks/whatsapp');
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);
    const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editHook, setEditHook] = useState<WebhookRow | null>(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editStatus, setEditStatus] = useState('active');
    const [deleteTarget, setDeleteTarget] = useState<WebhookRow | null>(null);
    const [deliveriesHook, setDeliveriesHook] = useState<WebhookRow | null>(null);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);

    async function load() {
        try {
            const res = await apiGet<{ webhooks: WebhookRow[] }>('/webhooks');
            if (res.success && res.data?.webhooks) setWebhooks(res.data.webhooks);
        } catch {
            setError(t('tenant.webhooks.errors.load'));
        }
    }

    useEffect(() => { void load(); }, []);

    async function onCreate(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setCreatedSecret(null);
        setSubmitting(true);
        try {
            const res = await apiPost<{ webhook: WebhookRow }>('/webhooks', {
                name, url, subscribed_events: ['message.sent', 'message.delivered', 'message.failed'],
            });
            if (res.success && res.data?.webhook) {
                setCreatedSecret(res.data.webhook.secret ?? null);
                await load();
            } else if (!res.success) {
                setError(res.error?.message ?? t('tenant.webhooks.errors.create'));
            }
        } catch { setError(t('tenant.webhooks.errors.create')); } finally { setSubmitting(false); }
    }

    async function saveEdit() {
        if (!editHook) return;
        setSubmitting(true);
        try {
            await apiPatch(`/webhooks/${editHook.id}`, { name: editName, url: editUrl, status: editStatus });
            setEditHook(null);
            await load();
        } catch { setError(t('tenant.webhooks.errors.update')); } finally { setSubmitting(false); }
    }

    async function rotateSecret(id: string) {
        try {
            const res = await apiPost<{ webhook: WebhookRow }>(`/webhooks/${id}/rotate-secret`);
            if (res.success && res.data?.webhook?.secret) setRotatedSecret(res.data.webhook.secret);
        } catch { setError(t('tenant.webhooks.errors.rotate')); }
    }

    async function loadDeliveries(hook: WebhookRow) {
        setDeliveriesHook(hook);
        try {
            const res = await apiGet<{ deliveries: Delivery[] }>(`/webhooks/${hook.id}/deliveries`);
            if (res.success && res.data?.deliveries) setDeliveries(res.data.deliveries);
        } catch { setError(t('tenant.webhooks.errors.log')); }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            await apiDelete(`/webhooks/${deleteTarget.id}`);
            setDeleteTarget(null);
            await load();
        } catch { setError(t('tenant.webhooks.errors.delete')); }
    }

    return (
        <TenantShell title={t('tenant.webhooks.title')} description={t('tenant.webhooks.description')}>
            <div className="space-y-6">
                <TenantPanel title={t('tenant.webhooks.create')}>
                    <form onSubmit={onCreate} className="space-y-3">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('common.name')} required />
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" dir="ltr" required />
                        <Button type="submit" disabled={submitting}><Plus className="size-4" /> {t('tenant.webhooks.create')}</Button>
                    </form>
                </TenantPanel>

                {(createdSecret || rotatedSecret) && (
                    <Alert tone="warning">
                        <p className="mb-2 font-semibold">{t('tenant.webhooks.copySecret')}</p>
                        <code className="block break-all font-mono text-sm" dir="ltr">{createdSecret ?? rotatedSecret}</code>
                    </Alert>
                )}
                {error && <Alert tone="danger">{error}</Alert>}

                <TenantPanel title={t('tenant.webhooks.listTitle', { count: webhooks.length })} flush>
                    {webhooks.length === 0 ? (
                        <TenantEmptyState icon={Webhook} title={t('tenant.webhooks.emptyTitle')} description={t('tenant.webhooks.emptyDescription')} />
                    ) : (
                        <ul className="tenant-list">
                            {webhooks.map((hook) => (
                                <li key={hook.id} className="tenant-list__item flex-wrap gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="tenant-list__primary">{hook.name}</p>
                                        <p className="tenant-list__secondary break-all" dir="ltr">{hook.url}</p>
                                        <p className="mt-1 text-caption">{(hook.subscribed_events ?? []).join(', ')}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={hook.status === 'active' ? 'success' : 'neutral'}>{hook.status}</Badge>
                                        <Button size="sm" variant="secondary" onClick={() => { setEditHook(hook); setEditName(hook.name); setEditUrl(hook.url); setEditStatus(hook.status); }}><Pencil className="size-4" /></Button>
                                        <Button size="sm" variant="secondary" onClick={() => void rotateSecret(hook.id)}><RefreshCw className="size-4" /></Button>
                                        <Button size="sm" variant="secondary" onClick={() => void loadDeliveries(hook)}><History className="size-4" /></Button>
                                        <Button size="sm" variant="secondary" onClick={async () => { try { await apiPost(`/webhooks/${hook.id}/test`); } catch { setError(t('tenant.webhooks.errors.test')); } }}>{t('tenant.webhooks.test')}</Button>
                                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(hook)}><Trash2 className="size-4" /></Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </TenantPanel>
            </div>

            <Dialog open={editHook !== null} onOpenChange={(o) => !o && setEditHook(null)}>
                <DialogContent>
                    <h3 className="text-lg font-bold">{t('tenant.webhooks.editTitle')}</h3>
                    <div className="mt-4 space-y-3">
                        <FormField id="webhook-edit-name" label={t('common.name')}><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></FormField>
                        <FormField id="webhook-edit-url" label={t('tenant.webhooks.url')}><Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} dir="ltr" /></FormField>
                        <FormField id="webhook-edit-status" label={t('common.status')}>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">active</SelectItem>
                                    <SelectItem value="disabled">disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                        <Button onClick={() => void saveEdit()} disabled={submitting}>{t('common.save')}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deliveriesHook !== null} onOpenChange={(o) => !o && setDeliveriesHook(null)}>
                <DialogContent className="max-w-2xl">
                    <h3 className="text-lg font-bold">{t('tenant.webhooks.deliveryLogTitle', { name: deliveriesHook?.name ?? '' })}</h3>
                    <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                        {deliveries.length === 0 ? <li className="text-sm text-[rgb(var(--muted))]">{t('tenant.webhooks.noDeliveries')}</li> : deliveries.map((d) => (
                            <li key={d.id} className="rounded border border-[rgb(var(--border))] p-3 text-sm">
                                <div className="flex justify-between"><span>{d.event_type}</span><Badge tone={d.status === 'delivered' ? 'success' : 'danger'}>{d.status}</Badge></div>
                                <p className="mt-1 text-caption" dir="ltr">HTTP {d.response_status ?? t('common.emDash')} · {d.duration_ms ?? t('common.emDash')}ms · {formatDate(d.created_at)}</p>
                            </li>
                        ))}
                    </ul>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)} title={t('tenant.webhooks.deleteTitle')} description={t('tenant.webhooks.deleteConfirm')} confirmLabel={t('common.delete')} tone="danger" onConfirm={() => void confirmDelete()} />
        </TenantShell>
    );
}
