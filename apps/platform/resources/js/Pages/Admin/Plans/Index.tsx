import { FormEvent, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminShell from '@/Layouts/AdminShell';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { ConfirmDialog } from '@/Components/ui/ConfirmDialog';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { Switch } from '@/Components/ui/Switch';
import { Textarea } from '@/Components/ui/Textarea';
import { Label } from '@/Components/ui/Label';
import type { PublicPlan } from '@/Components/patterns/PlanCard';
import { adminDelete, adminPatch, adminPost } from '@/Lib/api-client';
import { cn } from '@/Lib/cn';

type AdminPlan = PublicPlan & {
    is_public: boolean;
    is_active: boolean;
};

type PageProps = {
    plans: AdminPlan[];
};

type PlanForm = {
    name: string;
    slug: string;
    description: string;
    price_minor: number;
    annual_discount_percent: number | null;
    currency: string;
    duration_days: number;
    max_devices: number;
    monthly_message_limit: number;
    daily_message_limit_per_device: number;
    max_api_keys: number;
    max_webhooks: number;
    max_media_size_mb: number;
    allow_media: boolean;
    allow_priority_queue: boolean;
    allow_team_members: boolean;
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
};

const emptyForm: PlanForm = {
    name: '',
    slug: '',
    description: '',
    price_minor: 0,
    annual_discount_percent: null,
    currency: 'USD',
    duration_days: 30,
    max_devices: 1,
    monthly_message_limit: 100,
    daily_message_limit_per_device: 20,
    max_api_keys: 1,
    max_webhooks: 1,
    max_media_size_mb: 8,
    allow_media: false,
    allow_priority_queue: false,
    allow_team_members: false,
    is_public: true,
    is_active: true,
    sort_order: 100,
};

function formFromPlan(plan: AdminPlan): PlanForm {
    return {
        name: plan.name,
        slug: plan.slug,
        description: plan.description ?? '',
        price_minor: plan.price_minor,
        annual_discount_percent: plan.annual_discount_percent ?? null,
        currency: plan.currency,
        duration_days: plan.duration_days,
        max_devices: plan.max_devices,
        monthly_message_limit: plan.monthly_message_limit,
        daily_message_limit_per_device: plan.daily_message_limit_per_device,
        max_api_keys: plan.max_api_keys,
        max_webhooks: plan.max_webhooks,
        max_media_size_mb: plan.max_media_size_mb,
        allow_media: plan.allow_media,
        allow_priority_queue: plan.allow_priority_queue,
        allow_team_members: plan.allow_team_members,
        is_public: plan.is_public,
        is_active: plan.is_active,
        sort_order: plan.sort_order,
    };
}

function featuresToText(features: string[]): string {
    return features.join('\n');
}

function textToFeatures(text: string): string[] {
    return text
        .split(/[\n,]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 40);
}

export default function AdminPlansIndex({ plans: initialPlans }: PageProps) {
    const [plans, setPlans] = useState(initialPlans);
    const [form, setForm] = useState<PlanForm>(emptyForm);
    const [featuresText, setFeaturesText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null);

    const sorted = useMemo(
        () => [...plans].sort((a, b) => a.sort_order - b.sort_order || a.price_minor - b.price_minor),
        [plans],
    );

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setFeaturesText('');
        setError(null);
    }

    function startEdit(plan: AdminPlan) {
        setEditingId(plan.id);
        setForm(formFromPlan(plan));
        setFeaturesText(featuresToText(plan.features ?? []));
        setError(null);
    }

    function cancelEdit() {
        startCreate();
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const payload = {
            ...form,
            max_api_keys: form.max_devices,
            slug: form.slug || undefined,
            features: textToFeatures(featuresText),
        };
        try {
            if (editingId) {
                const res = await adminPatch<{ plan: AdminPlan }>(`/plans/${editingId}`, payload);
                if (!res.success) {
                    setError(res.error.message);
                    return;
                }
                setPlans((prev) => prev.map((p) => (p.id === editingId ? res.data.plan : p)));
                startCreate();
            } else {
                const res = await adminPost<{ plan: AdminPlan }>('/plans', payload);
                if (!res.success) {
                    setError(res.error.message);
                    return;
                }
                setPlans((prev) => [...prev, res.data.plan]);
                startCreate();
            }
            router.reload({ only: ['plans'] });
        } catch {
            setError(editingId ? 'تعذّر تحديث الخطة' : 'تعذّر إنشاء الخطة');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(plan: AdminPlan) {
        setError(null);
        const res = await adminPatch<{ plan: AdminPlan }>(`/plans/${plan.id}`, {
            is_active: !plan.is_active,
        });
        if (!res.success) {
            setError(res.error.message);
            return;
        }
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.data.plan : p)));
    }

    async function confirmDelete() {
        if (!deleteTarget) {
            return;
        }
        const res = await adminDelete<{ deleted: boolean }>(`/plans/${deleteTarget.id}`);
        if (!res.success) {
            setError(res.error.message);
            setDeleteTarget(null);
            return;
        }
        setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        if (editingId === deleteTarget.id) {
            startCreate();
        }
        setDeleteTarget(null);
    }

    return (
        <AdminShell
            title="الخطط والاشتراكات"
            description="أضف خططًا جديدة، عدّل الخطط الحالية، رتّبها، عطّلها، أو احذفها إن لم تكن مرتبطة باشتراكات نشطة."
        >
            <Head title="إدارة الخطط" />
            <div className="w-full space-y-6 lg:space-y-8">
                {error ? (
                    <Alert tone="danger" className="mt-6" title="خطأ">
                        {error}
                    </Alert>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
                    <section className="admin-panel p-4 sm:p-5 lg:p-6">
                        <h2 className="text-h3 text-[rgb(var(--text))]">الخطط الحالية</h2>
                        <ul className="mt-4 space-y-3">
                            {sorted.map((plan) => {
                                const isEditing = editingId === plan.id;
                                return (
                                    <li
                                        key={plan.id}
                                        className={cn(
                                            'flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 sm:flex-row sm:items-center sm:justify-between',
                                            isEditing
                                                ? 'border-[rgb(var(--brand-400))] ring-1 ring-[rgb(var(--brand-200))]'
                                                : 'border-[rgb(var(--border-soft))]',
                                        )}
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-[rgb(var(--brand-900))]">
                                                    {plan.name}
                                                </p>
                                                {isEditing ? <Badge tone="brand">جارٍ التعديل</Badge> : null}
                                                <Badge tone={plan.is_active ? 'success' : 'neutral'}>
                                                    {plan.is_active ? 'نشطة' : 'معطّلة'}
                                                </Badge>
                                                {plan.price_minor === 0 ? <Badge tone="brand">تجريبي</Badge> : null}
                                                {!plan.is_public ? <Badge tone="warning">خاصة</Badge> : null}
                                            </div>
                                            <p className="mt-1 text-caption text-[rgb(var(--muted))]" dir="ltr">
                                                {plan.slug} · sort {plan.sort_order} ·{' '}
                                                {plan.price_minor === 0
                                                    ? 'Free'
                                                    : `$${(plan.price_minor / 100).toFixed(2)}`}{' '}
                                                / {plan.duration_days}d
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => void (isEditing ? cancelEdit() : startEdit(plan))}
                                            >
                                                {isEditing ? 'إلغاء' : 'تعديل'}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => void toggleActive(plan)}
                                            >
                                                {plan.is_active ? 'تعطيل' : 'تفعيل'}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="danger"
                                                onClick={() => setDeleteTarget(plan)}
                                            >
                                                حذف
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <section className="admin-panel p-4 sm:p-5 lg:p-6">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-h3 text-[rgb(var(--text))]">
                                {editingId ? 'تعديل الخطة' : 'إضافة خطة'}
                            </h2>
                            {editingId ? (
                                <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                                    إلغاء التعديل
                                </Button>
                            ) : null}
                        </div>
                        <form onSubmit={onSubmit} className="mt-4 space-y-3">
                            <FormField id="plan-name" label="الاسم" required>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </FormField>
                            <FormField id="plan-slug" label="Slug" hint="اختياري — يُولَّد تلقائيًا">
                                <Input
                                    dir="ltr"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    placeholder="business-plus"
                                />
                            </FormField>
                            <FormField id="plan-desc" label="الوصف">
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField id="price" label="السعر (سنت)" hint="0 = مجاني">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.price_minor}
                                        onChange={(e) =>
                                            setForm({ ...form, price_minor: Number(e.target.value) })
                                        }
                                    />
                                </FormField>
                                <FormField id="days" label="المدة (يوم)">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.duration_days}
                                        onChange={(e) =>
                                            setForm({ ...form, duration_days: Number(e.target.value) })
                                        }
                                    />
                                </FormField>
                            </div>
                            <FormField
                                id="annual-discount"
                                label="خصم سنوي (%)"
                                hint="اتركه فارغًا إن لم يتوفر. يُطبَّق على سعر سنة كاملة في صفحة الأسعار."
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="10"
                                    value={form.annual_discount_percent ?? ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            annual_discount_percent:
                                                e.target.value === '' ? null : Number(e.target.value),
                                        })
                                    }
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField id="devices" label="أقصى أجهزة">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.max_devices}
                                        onChange={(e) =>
                                            setForm({ ...form, max_devices: Number(e.target.value) })
                                        }
                                    />
                                </FormField>
                                <FormField id="msgs" label="رسائل / شهر">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.monthly_message_limit}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                monthly_message_limit: Number(e.target.value),
                                            })
                                        }
                                    />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField id="daily" label="رسائل / يوم لكل جهاز">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.daily_message_limit_per_device}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                daily_message_limit_per_device: Number(e.target.value),
                                            })
                                        }
                                    />
                                </FormField>
                                <FormField id="media-mb" label="أقصى حجم وسائط (MB)">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.max_media_size_mb}
                                        onChange={(e) =>
                                            setForm({ ...form, max_media_size_mb: Number(e.target.value) })
                                        }
                                    />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField id="hooks" label="روابط الإشعارات (اختيارية)">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.max_webhooks}
                                        onChange={(e) =>
                                            setForm({ ...form, max_webhooks: Number(e.target.value) })
                                        }
                                    />
                                </FormField>
                            </div>
                            <FormField id="sort" label="ترتيب العرض">
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.sort_order}
                                    onChange={(e) =>
                                        setForm({ ...form, sort_order: Number(e.target.value) })
                                    }
                                />
                            </FormField>
                            <FormField
                                id="features"
                                label="المزايا"
                                hint="ميزة واحدة في كل سطر (أو افصلها بفاصلة)."
                            >
                                <Textarea
                                    value={featuresText}
                                    onChange={(e) => setFeaturesText(e.target.value)}
                                    rows={4}
                                    dir="rtl"
                                />
                            </FormField>

                            <div className="space-y-3 rounded-[var(--radius-md)] border border-[rgb(var(--border-soft))] p-3">
                                {(
                                    [
                                        ['allow_media', 'السماح بالوسائط'],
                                        ['allow_priority_queue', 'طابور أولوية'],
                                        ['allow_team_members', 'أعضاء فريق'],
                                        ['is_public', 'ظاهرة للعامة'],
                                        ['is_active', 'نشطة'],
                                    ] as const
                                ).map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between gap-3">
                                        <Label htmlFor={key}>{label}</Label>
                                        <Switch
                                            id={key}
                                            checked={form[key]}
                                            onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button type="submit" className="flex-1" loading={saving}>
                                    {editingId ? 'حفظ التعديلات' : 'حفظ الخطة'}
                                </Button>
                                {editingId ? (
                                    <Button type="button" variant="secondary" onClick={cancelEdit}>
                                        إلغاء
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </section>
                </div>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="حذف الخطة؟"
                description={
                    deleteTarget
                        ? `سيتم حذف «${deleteTarget.name}» ناعمًا. لا يمكن الحذف إن وُجدت اشتراكات نشطة.`
                        : undefined
                }
                confirmLabel="حذف"
                onConfirm={() => void confirmDelete()}
            />
        </AdminShell>
    );
}
