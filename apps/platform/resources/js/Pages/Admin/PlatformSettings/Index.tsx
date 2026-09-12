import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bot, Sparkles } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { Alert } from '@/Components/ui/Alert';
import { Button } from '@/Components/ui/Button';
import { Switch } from '@/Components/ui/Switch';
import { Label } from '@/Components/ui/Label';

type PageProps = {
    aiMasterEnabled: boolean;
    flash?: { success?: string };
};

export default function PlatformSettingsIndex({ aiMasterEnabled: initialEnabled }: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [enabled, setEnabled] = useState(initialEnabled);
    const [saving, setSaving] = useState(false);

    function handleToggle(next: boolean) {
        setEnabled(next);
        setSaving(true);
        router.post(
            '/admin/ai/toggle',
            { enabled: next },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onError: () => setEnabled(!next),
            },
        );
    }

    return (
        <AdminShell
            title="إعدادات المنصة"
            description="التحكم العام بخدمات المنصة مثل مساعد الذكاء الاصطناعي."
        >
            <Head title="إعدادات المنصة" />

            {flash?.success ? (
                <Alert tone="success" title={flash.success} className="mb-4" />
            ) : null}

            <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Sparkles className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold text-[rgb(var(--brand-950))]">
                                    مساعد الذكاء الاصطناعي
                                </h2>
                                <p className="text-sm text-[rgb(var(--muted))]">
                                    مفتاح تشغيل عام لكل المستأجرين. عند الإيقاف تتوقف الردود التلقائية بالـ AI فوراً.
                                </p>
                            </div>
                        </div>
                        <ul className="mt-3 list-disc space-y-1 pe-5 text-sm text-[rgb(var(--muted))]">
                            <li>المستأجر يضع مفتاح Gemini الخاص به من صفحة المساعد.</li>
                            <li>ميزة ai_assistant تُفعّل أيضاً عبر الخطط.</li>
                            <li>هذا المفتاح لا يستبدل مفاتيح المستأجرين — هو فقط تشغيل/إيقاف المنصة.</li>
                        </ul>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] px-4 py-3">
                        <Bot className="h-5 w-5 text-emerald-600" />
                        <div className="flex items-center gap-2">
                            <Switch
                                id="ai-master"
                                checked={enabled}
                                disabled={saving}
                                onCheckedChange={handleToggle}
                            />
                            <Label htmlFor="ai-master" className="font-semibold">
                                {enabled ? 'مفعّل على المنصة' : 'متوقف للصيانة'}
                            </Label>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <Link href="/admin/plans">
                        <Button type="button" variant="secondary">
                            إدارة الخطط وميزة AI
                        </Button>
                    </Link>
                </div>
            </section>
        </AdminShell>
    );
}
