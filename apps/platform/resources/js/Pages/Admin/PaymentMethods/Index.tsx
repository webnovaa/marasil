import { FormEvent, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
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

export type AdminPaymentMethod = {
    id: string;
    code: string;
    name: string;
    badge: string | null;
    address_or_code: string;
    account_holder: string | null;
    network: string | null;
    instructions: string | null;
    qr_payload: string;
    is_enabled: boolean;
    sort_order: number;
};

type PageProps = {
    methods: AdminPaymentMethod[];
    flash?: { success?: string };
    errors?: Record<string, string>;
};

type MethodForm = {
    code: string;
    name: string;
    badge: string;
    address_or_code: string;
    account_holder: string;
    network: string;
    instructions: string;
    qr_payload: string;
    is_enabled: boolean;
    sort_order: number;
};

const emptyForm: MethodForm = {
    code: '',
    name: '',
    badge: '',
    address_or_code: '',
    account_holder: '',
    network: '',
    instructions: '',
    qr_payload: '',
    is_enabled: true,
    sort_order: 100,
};

function formFromMethod(m: AdminPaymentMethod): MethodForm {
    return {
        code: m.code,
        name: m.name,
        badge: m.badge ?? '',
        address_or_code: m.address_or_code,
        account_holder: m.account_holder ?? '',
        network: m.network ?? '',
        instructions: m.instructions ?? '',
        qr_payload: m.qr_payload ?? '',
        is_enabled: m.is_enabled,
        sort_order: m.sort_order,
    };
}

export default function PaymentMethodsIndex({ methods: initialMethods }: PageProps) {
    const { flash, errors } = usePage<PageProps>().props;
    const [methods, setMethods] = useState(initialMethods);
    const [form, setForm] = useState<MethodForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminPaymentMethod | null>(null);

    const sorted = useMemo(
        () => [...methods].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
        [methods],
    );

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
    }

    function startEdit(m: AdminPaymentMethod) {
        setEditingId(m.id);
        setForm(formFromMethod(m));
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...form,
            is_enabled: form.is_enabled ? 1 : 0,
        };
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['methods'] });
                if (!editingId) startCreate();
            },
            onFinish: () => setSaving(false),
        };

        if (editingId) {
            router.put(`/admin/payment-methods/${editingId}`, payload, opts);
        } else {
            router.post('/admin/payment-methods', payload, opts);
        }
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/payment-methods/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setMethods((prev) => prev.filter((m) => m.id !== deleteTarget.id));
                if (editingId === deleteTarget.id) startCreate();
                setDeleteTarget(null);
            },
        });
    }

    return (
        <AdminShell
            title="طرق الدفع اليدوية"
            description="أضف عناوين المحافظ والحسابات التي تظهر للمستأجر عند الاشتراك."
        >
            <Head title="طرق الدفع" />

            {flash?.success ? <Alert tone="success" title={flash.success} className="mb-4" /> : null}
            {errors && Object.keys(errors).length > 0 ? (
                <Alert
                    tone="danger"
                    title={Object.values(errors).join(' ')}
                    className="mb-4"
                />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                            <h2 className="font-bold">الطرق الحالية ({sorted.length})</h2>
                        </div>
                        <Button type="button" size="sm" onClick={startCreate}>
                            <Plus className="h-4 w-4" />
                            جديد
                        </Button>
                    </div>
                    <div className="divide-y divide-[rgb(var(--border))]">
                        {sorted.length === 0 ? (
                            <p className="p-6 text-sm text-[rgb(var(--muted))]">
                                لا توجد طرق دفع بعد. أضف أول طريقة من النموذج.
                            </p>
                        ) : (
                            sorted.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-bold">{m.name}</p>
                                            <Badge tone={m.is_enabled ? 'success' : 'neutral'}>
                                                {m.is_enabled ? 'مفعّلة' : 'معطّلة'}
                                            </Badge>
                                            {m.badge ? <Badge tone="neutral">{m.badge}</Badge> : null}
                                        </div>
                                        <p className="font-mono text-xs text-[rgb(var(--muted))]" dir="ltr">
                                            {m.code} · {m.address_or_code}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(m)}>
                                            <Pencil className="h-4 w-4" />
                                            تعديل
                                        </Button>
                                        <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget(m)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
                    <h2 className="mb-4 font-bold">
                        {editingId ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <FormField label="الرمز الداخلي (code)">
                            <Input
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                placeholder="usdt"
                                required
                                dir="ltr"
                                disabled={Boolean(editingId)}
                            />
                        </FormField>
                        <FormField label="الاسم الظاهر">
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="شارة قصيرة">
                            <Input
                                value={form.badge}
                                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                                placeholder="عالمي وسريع"
                            />
                        </FormField>
                        <FormField label="العنوان / رقم الحساب">
                            <Input
                                value={form.address_or_code}
                                onChange={(e) => setForm({ ...form, address_or_code: e.target.value })}
                                required
                                dir="ltr"
                            />
                        </FormField>
                        <FormField label="اسم صاحب الحساب">
                            <Input
                                value={form.account_holder}
                                onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                            />
                        </FormField>
                        <FormField label="الشبكة">
                            <Input
                                value={form.network}
                                onChange={(e) => setForm({ ...form, network: e.target.value })}
                                placeholder="TRON (TRC20)"
                            />
                        </FormField>
                        <FormField label="تعليمات الدفع">
                            <Textarea
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                rows={3}
                            />
                        </FormField>
                        <FormField label="محتوى QR (اختياري)">
                            <Input
                                value={form.qr_payload}
                                onChange={(e) => setForm({ ...form, qr_payload: e.target.value })}
                                dir="ltr"
                            />
                        </FormField>
                        <FormField label="ترتيب العرض">
                            <Input
                                type="number"
                                value={form.sort_order}
                                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                            />
                        </FormField>
                        <div className="flex items-center gap-2 py-1">
                            <Switch
                                id="method-enabled"
                                checked={form.is_enabled}
                                onCheckedChange={(v) => setForm({ ...form, is_enabled: v })}
                            />
                            <Label htmlFor="method-enabled">مفعّلة للمستأجرين</Label>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'جاري الحفظ…' : editingId ? 'حفظ التعديلات' : 'إضافة الطريقة'}
                            </Button>
                            {editingId ? (
                                <Button type="button" variant="secondary" onClick={startCreate}>
                                    إلغاء
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </section>
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="حذف طريقة الدفع؟"
                description={deleteTarget ? `سيتم حذف «${deleteTarget.name}» ولن تظهر للمستأجرين.` : ''}
                confirmLabel="حذف"
                onConfirm={confirmDelete}
            />
        </AdminShell>
    );
}
