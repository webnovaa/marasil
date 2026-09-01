import { FormEvent, useEffect, useState } from 'react';
import { Plus, Webhook } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import TenantShell from '@/Layouts/TenantShell';
import { apiGet, apiPost } from '@/Lib/api-client';

type WebhookRow = {
    id: string;
    name: string;
    url: string;
    subscribed_events: string[];
    status: string;
    secret?: string;
};

export default function WebhooksIndex() {
    const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
    const [name, setName] = useState('Production webhook');
    const [url, setUrl] = useState('https://example.com/webhooks/whatsapp');
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function load() {
        try {
            const res = await apiGet<{ webhooks: WebhookRow[] }>('/webhooks');
            if (res.success && res.data?.webhooks) {
                setWebhooks(res.data.webhooks);
            }
        } catch {
            setError('تعذر تحميل Webhooks');
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function onCreate(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setCreatedSecret(null);
        setSubmitting(true);
        try {
            const res = await apiPost<{ webhook: WebhookRow }>('/webhooks', {
                name,
                url,
                subscribed_events: ['message.sent', 'message.delivered', 'message.failed'],
            });
            if (!res.success) {
                setError(res.error.message ?? 'فشل إنشاء Webhook');
                return;
            }
            if (!res.data?.webhook) {
                setError('فشل إنشاء Webhook');
                return;
            }
            setCreatedSecret(res.data.webhook.secret ?? null);
            await load();
        } catch {
            setError('فشل إنشاء Webhook');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <TenantShell
            title="Webhooks"
            description="استقبال أحداث الرسائل موقّعة بـ HMAC — يظهر السر مرة واحدة فقط."
        >
            <div className="space-y-6">
                <div>
                    <TenantPanel title="إنشاء Webhook جديد">
                        <form onSubmit={onCreate} className="space-y-3">
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" required />
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://…"
                                dir="ltr"
                                required
                            />
                            <Button type="submit" disabled={submitting} className="w-full sm:w-auto mt-2">
                                <Plus className="size-4" aria-hidden />
                                {submitting ? 'جارٍ الإنشاء...' : 'إنشاء Webhook'}
                            </Button>
                        </form>
                    </TenantPanel>
                </div>

                {createdSecret ? (
                    <div>
                        <TenantPanel variant="soft" title="انسخ السر الآن">
                            <p className="mb-4 text-body text-[rgb(var(--warning-600))]">
                                استخدم هذا السر للتحقق من توقيع HMAC — لن يظهر مجدداً.
                            </p>
                            <code className="block break-all rounded-[var(--radius-lg)] border border-[rgb(var(--border-subtle))] bg-white p-4 font-mono text-sm font-bold text-[rgb(var(--brand-950))] leading-relaxed shadow-inner" dir="ltr">
                                {createdSecret}
                            </code>
                        </TenantPanel>
                    </div>
                ) : null}

                {error ? <p className="text-sm text-[rgb(var(--danger-text))]">{error}</p> : null}

                <div>
                    <TenantPanel title={`Webhooks (${webhooks.length})`} flush>
                        {webhooks.length === 0 ? (
                            <TenantEmptyState
                                icon={Webhook}
                                title="لا توجد Webhooks"
                                description="أنشئ نقطة استقبال لتلقي أحداث الرسائل في نظامك."
                            />
                        ) : (
                            <ul className="tenant-list">
                                {webhooks.map((hook) => (
                                    <li key={hook.id} className="tenant-list__item">
                                        <div className="min-w-0 flex-1">
                                            <p className="tenant-list__primary">{hook.name}</p>
                                            <p className="tenant-list__secondary break-all" dir="ltr">
                                                {hook.url}
                                            </p>
                                            <p className="mt-1 text-caption text-[rgb(var(--subtle))]">
                                                {(hook.subscribed_events ?? []).join(', ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge tone={hook.status === 'active' ? 'success' : 'neutral'}>
                                                {hook.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={async () => {
                                                    setError(null);
                                                    try {
                                                        const res = await apiPost(`/webhooks/${hook.id}/test`);
                                                        if (!res.success) {
                                                            setError(res.error.message);
                                                        }
                                                    } catch {
                                                        setError('فشل اختبار Webhook');
                                                    }
                                                }}
                                            >
                                                اختبار
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </TenantPanel>
                </div>
            </div>
        </TenantShell>
    );
}
