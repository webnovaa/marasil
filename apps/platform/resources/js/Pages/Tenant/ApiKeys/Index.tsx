import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Copy, KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { CodeBlock } from '@/Components/ui/CodeBlock';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { Input } from '@/Components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { FormField } from '@/Components/ui/FormField';
import TenantShell from '@/Layouts/TenantShell';
import {
    buildIntegrationSnippet,
    INTEGRATION_LANGUAGES,
    type IntegrationLanguage,
} from '@/Lib/api-integration-snippets';
import { apiDelete, apiGet, apiPost } from '@/Lib/api-client';

type ApiKeyRow = {
    id: string;
    name: string;
    prefix: string;
    environment: string;
    revoked_at: string | null;
    secret?: string;
    key?: string;
    api_key?: string;
    can_reveal?: boolean;
    device_bound?: boolean;
    device_id?: string | null;
    device_name?: string | null;
};

type ApiKeysResponse = {
    api_keys: ApiKeyRow[];
    tenant?: { username: string; slug: string; name?: string };
    api_base_url?: string;
};

function resolveKeyValue(key: ApiKeyRow): string | null {
    return key.api_key ?? key.secret ?? key.key ?? null;
}

function normalizeApiBaseUrl(url?: string): string {
    const fallback = `${window.location.origin}/api/v1`;

    if (!url) {
        return fallback;
    }

    try {
        const parsed = new URL(url);

        if (parsed.hostname === 'nginx' || parsed.hostname === 'api') {
            return fallback;
        }

        return url.replace(/\/$/, '');
    } catch {
        return fallback;
    }
}

export default function ApiKeysIndex() {
    const [keys, setKeys] = useState<ApiKeyRow[]>([]);
    const [username, setUsername] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState(`${window.location.origin}/api/v1`);
    const [name, setName] = useState('مفتاح عام');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState<string>('');
    const [selectedLang, setSelectedLang] = useState<IntegrationLanguage>('curl');
    const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);
    const [revoking, setRevoking] = useState(false);

    const activeKeys = useMemo(() => keys.filter((k) => !k.revoked_at), [keys]);

    const selectedKey = useMemo(
        () => activeKeys.find((k) => k.id === selectedKeyId) ?? activeKeys[0] ?? null,
        [activeKeys, selectedKeyId],
    );

    async function load() {
        try {
            const res = await apiGet<ApiKeysResponse>('/api-keys');
            if (res.success && res.data?.api_keys) {
                setKeys(res.data.api_keys);
                if (res.data.tenant?.username) {
                    setUsername(res.data.tenant.username);
                }
                if (res.data.api_base_url) {
                    setApiBaseUrl(normalizeApiBaseUrl(res.data.api_base_url));
                }
                const firstActive = res.data.api_keys.find((k) => !k.revoked_at);
                if (firstActive && !selectedKeyId) {
                    setSelectedKeyId(firstActive.id);
                }
            }
        } catch {
            setError('تعذر تحميل المفاتيح');
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function onCreate(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await apiPost<{ api_key: ApiKeyRow }>('/api-keys', {
                name,
                environment: 'live',
            });
            if (!res.success || !res.data?.api_key) {
                setError(res.success ? 'فشل إنشاء المفتاح' : (res.error?.message ?? 'فشل إنشاء المفتاح'));
                return;
            }
            setSelectedKeyId(res.data.api_key.id);
            await load();
        } catch {
            setError('فشل إنشاء المفتاح');
        } finally {
            setSubmitting(false);
        }
    }

    async function rotate(id: string) {
        setError(null);
        try {
            const res = await apiPost<{ api_key: ApiKeyRow }>(`/api-keys/${id}/rotate`);
            if (!res.success || !res.data?.api_key) {
                setError(res.success ? 'فشل التدوير' : (res.error?.message ?? 'فشل التدوير'));
                return;
            }
            setSelectedKeyId(res.data.api_key.id);
            await load();
        } catch {
            setError('فشل تدوير المفتاح');
        }
    }

    async function revoke(id: string) {
        setRevoking(true);
        setError(null);
        try {
            const res = await apiDelete(`/api-keys/${id}`);
            if (!res.success) {
                setError(res.error?.message ?? 'فشل إلغاء المفتاح');
                return;
            }
            setRevokeTarget(null);
            await load();
        } catch {
            setError('فشل إلغاء المفتاح');
        } finally {
            setRevoking(false);
        }
    }

    async function copyText(value: string) {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // ignore
        }
    }

    const snippet = useMemo(() => {
        if (!selectedKey) {
            return null;
        }
        return buildIntegrationSnippet(selectedLang, {
            baseUrl: apiBaseUrl,
            apiKey: resolveKeyValue(selectedKey) ?? `${selectedKey.prefix}…`,
            username,
            deviceName: selectedKey.device_name ?? selectedKey.name,
            deviceBound: Boolean(selectedKey.device_bound),
            deviceId: selectedKey.device_id ?? undefined,
        });
    }, [selectedKey, selectedLang, apiBaseUrl, username]);

    return (
        <TenantShell
            title="مفاتيح API"
            description="أدر مفاتيح الربط وانسخ أمثلة جاهزة بلغتك البرمجية."
        >
            <div className="space-y-6">
                <div>
                    <TenantPanel title="إنشاء مفتاح عام" description="مفاتيح الأجهزة تُنشأ تلقائياً من صفحة الأجهزة.">
                        <form onSubmit={onCreate} className="tenant-toolbar">
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المفتاح" required />
                            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                                <Plus className="size-4" aria-hidden />
                                {submitting ? 'جارٍ الإنشاء...' : 'مفتاح جديد'}
                            </Button>
                        </form>
                    </TenantPanel>
                </div>

                {error ? <Alert tone="danger" title="خطأ">{error}</Alert> : null}

                <div>
                    <TenantPanel title={`كل المفاتيح (${keys.length})`} flush>
                        {keys.length === 0 ? (
                            <TenantEmptyState
                                icon={KeyRound}
                                title="لا توجد مفاتيح"
                                description="أضف جهازاً أو أنشئ مفتاحاً عاماً للبدء."
                            />
                        ) : (
                            <ul className="tenant-list">
                                {keys.map((key, index) => {
                                    const visible = resolveKeyValue(key);
                                    const isActive = !key.revoked_at;
                                    const needsRotate = isActive && !visible && key.can_reveal === false;
                                    return (
                                        <li key={key.id} className="tenant-list__item flex-col items-stretch gap-4 sm:flex-row sm:items-center" style={{ animationDelay: `${0.05 * (index + 1)}s` }}>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="tenant-list__primary">{key.name}</p>
                                                    <Badge tone={isActive ? 'success' : 'danger'}>
                                                        {isActive ? 'نشط' : 'ملغى'}
                                                    </Badge>
                                                    {key.device_bound ? (
                                                        <Badge tone="neutral">جهاز</Badge>
                                                    ) : (
                                                        <Badge tone="neutral">عام</Badge>
                                                    )}
                                                </div>
                                                {key.device_bound && key.device_id ? (
                                                    <p className="text-body-sm text-[rgb(var(--muted))]">
                                                        جهاز:{' '}
                                                        <Link href={`/devices/${key.device_id}`} className="font-semibold text-[rgb(var(--brand-700))] hover:underline">
                                                            {key.device_name ?? key.device_id}
                                                        </Link>
                                                    </p>
                                                ) : null}
                                                <div className="flex gap-2">
                                                    <Input
                                                        dir="ltr"
                                                        readOnly
                                                        value={visible ?? `${key.prefix}••••••••`}
                                                        className="font-mono text-sm"
                                                    />
                                                    {visible ? (
                                                        <Button type="button" variant="secondary" size="sm" onClick={() => void copyText(visible)}>
                                                            <Copy className="size-4" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                                {needsRotate ? (
                                                    <Alert tone="warning" title="المفتاح غير مخزّن للعرض">
                                                        اضغط «تدوير» مرة واحدة — بعدها يبقى ظاهراً دائماً.
                                                    </Alert>
                                                ) : null}
                                                {username ? (
                                                    <p className="tenant-list__secondary" dir="ltr">
                                                        Username: {username} · {key.environment}
                                                    </p>
                                                ) : (
                                                    <p className="tenant-list__secondary" dir="ltr">{key.prefix} · {key.environment}</p>
                                                )}
                                            </div>
                                            {isActive ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => setSelectedKeyId(key.id)}>
                                                        <BookOpen className="size-4" />
                                                        أمثلة
                                                    </Button>
                                                    <Button size="sm" variant="secondary" onClick={() => void rotate(key.id)}>
                                                        <RefreshCw className="size-4" />
                                                        تدوير
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => setRevokeTarget(key)}>
                                                        <Trash2 className="size-4" />
                                                        إلغاء
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </TenantPanel>
                </div>

                <div>
                    <TenantPanel
                        title="دليل الربط للمطورين"
                        description="اختر المفتاح واللغة — انسخ الكود وأرسله لشريكك."
                    >
                        {activeKeys.length === 0 ? (
                            <p className="text-body-sm text-[rgb(var(--muted))]">أنشئ مفتاحاً أو جهازاً لعرض أمثلة الربط.</p>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-label text-[rgb(var(--brand-950))]">المفتاح</p>
                                        <Select value={selectedKey?.id ?? ''} onValueChange={setSelectedKeyId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر مفتاح API" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeKeys.map((key) => (
                                                    <SelectItem key={key.id} value={key.id}>
                                                        {key.name}{key.device_bound ? ' (جهاز)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <FormField id="docs-username" label="Username">
                                            <div className="flex gap-2">
                                                <Input id="docs-username" dir="ltr" readOnly value={username || '—'} />
                                                {username ? (
                                                    <Button type="button" variant="secondary" size="sm" onClick={() => void copyText(username)}>
                                                        <Copy className="size-4" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </FormField>
                                    </div>
                                </div>

                                {selectedKey ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField id="docs-device-name" label="Device name">
                                            <Input id="docs-device-name" readOnly value={selectedKey.device_name ?? selectedKey.name} />
                                        </FormField>
                                        <FormField
                                            id="docs-api-key"
                                            label="API Key"
                                            hint="انسخه وأعطِه لشريكك — يبقى ظاهراً دائماً."
                                        >
                                            <div className="flex gap-2">
                                                <Input
                                                    id="docs-api-key"
                                                    dir="ltr"
                                                    readOnly
                                                    className="font-mono text-sm"
                                                    value={resolveKeyValue(selectedKey) ?? `${selectedKey.prefix}••••••••`}
                                                />
                                                {resolveKeyValue(selectedKey) ? (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => void copyText(resolveKeyValue(selectedKey)!)}
                                                    >
                                                        <Copy className="size-4" />
                                                    </Button>
                                                ) : (
                                                    <Button type="button" variant="secondary" size="sm" onClick={() => void rotate(selectedKey.id)}>
                                                        <RefreshCw className="size-4" />
                                                        تدوير
                                                    </Button>
                                                )}
                                            </div>
                                        </FormField>
                                    </div>
                                ) : null}

                                <div>
                                    <p className="mb-2 text-label text-[rgb(var(--brand-950))]">لغة البرمجة</p>
                                    <div className="flex flex-wrap gap-2">
                                        {INTEGRATION_LANGUAGES.map((lang) => (
                                            <Button
                                                key={lang.id}
                                                type="button"
                                                size="sm"
                                                variant={selectedLang === lang.id ? 'primary' : 'secondary'}
                                                onClick={() => setSelectedLang(lang.id)}
                                            >
                                                {lang.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {selectedKey?.device_bound ? (
                                    <Alert tone="neutral" title="مفتاح مربوط بجهاز">
                                        لا حاجة لـ device_id في الطلب — المفتاح يرسل من جهاز «{selectedKey.device_name ?? selectedKey.name}» تلقائياً.
                                    </Alert>
                                ) : (
                                    <Alert tone="info" title="مفتاح عام">
                                        يجب تمرير device_id في جسم الطلب. استبدل YOUR_DEVICE_ULID بمعرّف جهازك المتصل.
                                    </Alert>
                                )}

                                {snippet ? (
                                    <CodeBlock code={snippet.code} language={snippet.language} />
                                ) : null}

                                <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border-soft))] bg-[rgb(var(--surface-muted))] p-4 text-body-sm text-[rgb(var(--muted))]">
                                    <p className="font-semibold text-[rgb(var(--brand-950))]">البيانات الثلاثة لشريكك:</p>
                                    <ul className="mt-2 list-disc list-inside space-y-1" dir="ltr">
                                        <li>Username: {username || 'tenant-slug'}</li>
                                        <li>Device name: {selectedKey?.device_name ?? selectedKey?.name ?? '—'}</li>
                                        <li>API Key: {selectedKey ? (resolveKeyValue(selectedKey) ?? '—') : '—'}</li>
                                    </ul>
                                    <p className="mt-3">Endpoint: <code dir="ltr">POST {apiBaseUrl}/messages/text</code></p>
                                </div>
                            </div>
                        )}
                    </TenantPanel>
                </div>
            </div>

            <ConfirmDialog
                open={revokeTarget !== null}
                onOpenChange={(open) => !open && setRevokeTarget(null)}
                title="إلغاء المفتاح"
                description={revokeTarget ? `هل تريد إلغاء «${revokeTarget.name}»؟ لن يعمل بعد الآن.` : undefined}
                confirmLabel="إلغاء المفتاح"
                tone="danger"
                loading={revoking}
                onConfirm={() => { if (revokeTarget) void revoke(revokeTarget.id); }}
            />
        </TenantShell>
    );
}
