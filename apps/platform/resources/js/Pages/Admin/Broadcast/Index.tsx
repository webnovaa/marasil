import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertOctagon,
    AlertTriangle,
    Bell,
    Check,
    CheckCircle2,
    Clock,
    Crown,
    HelpCircle,
    Info,
    Megaphone,
    MessageCircle,
    Send,
    Sparkles,
    Users,
} from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Badge } from '@/Components/ui/Badge';
import { cn } from '@/Lib/cn';

interface Stats {
    total_users: number;
    active_subscribers: number;
    trial_users: number;
}

interface RecentBroadcast {
    id: number;
    created_at: string | null;
    sender: string;
    title: string;
    type: string;
    target_audience: string;
    recipients_count: number;
    whatsapp_sent: number;
}

interface Props {
    stats: Stats;
    recent_broadcasts: RecentBroadcast[];
}

type BroadcastType = 'info' | 'warning' | 'success' | 'urgent';
type TargetAudience = 'all' | 'active_subscribers' | 'trial_users';

export default function AdminBroadcastIndex({ stats, recent_broadcasts }: Props) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<BroadcastType>('info');
    const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            setError('يرجى كتابة عنوان ونص الإشعار.');
            return;
        }

        setSubmitting(true);
        setError(null);

        router.post(
            '/admin/broadcast',
            {
                title: title.trim(),
                body: body.trim(),
                type,
                target_audience: targetAudience,
                send_whatsapp: sendWhatsApp,
            },
            {
                onSuccess: () => {
                    setTitle('');
                    setBody('');
                    setSubmitting(false);
                },
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    setError(typeof first === 'string' ? first : 'تعذر إرسال الإشعار.');
                    setSubmitting(false);
                },
            }
        );
    }

    const typeConfigs: Record<
        BroadcastType,
        { label: string; icon: typeof Info; bg: string; text: string; ring: string }
    > = {
        info: {
            label: 'معلومة / تحديث عام',
            icon: Megaphone,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            ring: 'border-blue-300',
        },
        warning: {
            label: 'تنبيه / صيانة مجدولة',
            icon: AlertTriangle,
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            ring: 'border-amber-300',
        },
        success: {
            label: 'ميزة جديدة / عرض حصري',
            icon: Sparkles,
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            ring: 'border-emerald-300',
        },
        urgent: {
            label: 'هام جداً / أمني عاجل',
            icon: AlertOctagon,
            bg: 'bg-red-50',
            text: 'text-red-700',
            ring: 'border-red-300',
        },
    };

    const targetLabels: Record<TargetAudience, { label: string; count: number; desc: string }> = {
        all: {
            label: 'جميع المستخدمين',
            count: stats.total_users,
            desc: 'يصل الإشعار إلى جميع الحسابات المسجلة بالمنصة',
        },
        active_subscribers: {
            label: 'المشتركون النشطون فقط',
            count: stats.active_subscribers,
            desc: 'أصحاب الاشتراكات الشهرية والسنوية الفعّالة',
        },
        trial_users: {
            label: 'المستخدمون في التجربة',
            count: stats.trial_users,
            desc: 'الحسابات التي تستخدم الباقة التجريبية المجانية',
        },
    };

    return (
        <AdminShell
            title="بث الإعلانات والإشعارات الجماعية"
            description="إرسال رسائل وتنبيهات فورية تظهر في لوحة تحكم المستخدمين وجرس الإشعارات، مع إمكانية الإرسال عبر واتساب المنصة."
        >
            {/* Quick KPI Stats */}
            <div className="grid gap-3 sm:grid-cols-3 mb-5">
                <div className="admin-panel--soft rounded-xl p-4 border border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[rgb(var(--muted))]">إجمالي الحسابات المسجلة</span>
                        <Users className="size-4 text-[rgb(var(--brand-700))]" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-[rgb(var(--brand-950))]">
                        {stats.total_users}
                    </p>
                </div>

                <div className="admin-panel--soft rounded-xl p-4 border border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[rgb(var(--muted))]">المشتركون النشطون (مدفوع)</span>
                        <Crown className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-emerald-700">
                        {stats.active_subscribers}
                    </p>
                </div>

                <div className="admin-panel--soft rounded-xl p-4 border border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[rgb(var(--muted))]">حسابات الفترة التجريبية</span>
                        <Sparkles className="size-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-amber-600">
                        {stats.trial_users}
                    </p>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            {/* Main Form & Live Preview Grid */}
            <div className="grid gap-5 lg:grid-cols-12 mb-8">
                {/* Compose Form (7 cols) */}
                <div className="admin-panel lg:col-span-7 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgb(var(--border))]">
                        <Megaphone className="size-5 text-[rgb(var(--brand-700))]" />
                        <h2 className="text-base font-extrabold text-[rgb(var(--brand-950))]">
                            إنشاء إشعار جماعي جديد
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold text-[rgb(var(--text))] mb-1.5">
                                عنوان الإشعار / الإعلان <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="مثال: تحديث أمني هام في خوادم الواتساب"
                                maxLength={120}
                                required
                            />
                        </div>

                        {/* Category Type */}
                        <div>
                            <label className="block text-xs font-bold text-[rgb(var(--text))] mb-1.5">
                                نوع وتصنيف الإشعار
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(Object.keys(typeConfigs) as BroadcastType[]).map((key) => {
                                    const cfg = typeConfigs[key];
                                    const isSelected = type === key;
                                    const IconComp = cfg.icon;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setType(key)}
                                            className={cn(
                                                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition',
                                                isSelected
                                                    ? `${cfg.bg} ${cfg.ring} border-2 font-bold shadow-xs`
                                                    : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-soft))]'
                                            )}
                                        >
                                            <IconComp className={cn('size-4 mb-1', cfg.text)} />
                                            <span className="text-[11px] font-semibold">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="block text-xs font-bold text-[rgb(var(--text))] mb-1.5">
                                الشريحة المستهدفة
                            </label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {(Object.keys(targetLabels) as TargetAudience[]).map((key) => {
                                    const audience = targetLabels[key];
                                    const isSelected = targetAudience === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTargetAudience(key)}
                                            className={cn(
                                                'flex flex-col items-start p-3 rounded-xl border text-start transition',
                                                isSelected
                                                    ? 'border-[rgb(var(--brand-600))] bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                                                    : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-soft))]'
                                            )}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-xs font-bold text-[rgb(var(--text))]">
                                                    {audience.label}
                                                </span>
                                                {isSelected ? (
                                                    <Check className="size-3.5 text-[rgb(var(--brand-600))]" />
                                                ) : null}
                                            </div>
                                            <span className="text-[10px] text-[rgb(var(--muted))] mt-1">
                                                ({audience.count} مستخدم)
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message Body */}
                        <div>
                            <label className="block text-xs font-bold text-[rgb(var(--text))] mb-1.5">
                                نص وتفاصيل الإشعار <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="اكتب نص الإشعار هنا بكل وضوح..."
                                rows={4}
                                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-xs leading-relaxed transition focus:border-[rgb(var(--brand-400))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-200))]"
                                required
                            />
                        </div>

                        {/* WhatsApp Broadcast Checkbox */}
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-3">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendWhatsApp}
                                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                                    className="mt-0.5 rounded text-[rgb(var(--brand-600))] focus:ring-[rgb(var(--brand-400))]"
                                />
                                <div>
                                    <span className="text-xs font-bold text-[rgb(var(--text))] flex items-center gap-1.5">
                                        <MessageCircle className="size-3.5 text-emerald-600" />
                                        إرسال نسخة عبر رقم واتساب المنصة الرسمي
                                    </span>
                                    <p className="text-[11px] text-[rgb(var(--muted))] mt-0.5">
                                        سيتم إرسال رسالة واتساب إلى أرقام المستخدمين المسجلة في الحساب بجانب ظهور الإشعار في لوحة التحكم.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || !title.trim() || !body.trim()}
                                className="w-full sm:w-auto min-w-48 gap-2"
                            >
                                <Send className="size-4" />
                                {submitting ? 'جارٍ البث والإرسال...' : `بث الإشعار إلى (${targetLabels[targetAudience].count}) مستخدم`}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Live Preview Card (5 cols) */}
                <div className="admin-panel lg:col-span-5 p-5 sm:p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgb(var(--border))]">
                        <Sparkles className="size-5 text-amber-500" />
                        <h2 className="text-base font-extrabold text-[rgb(var(--brand-950))]">
                            معاينة حية للإشعار
                        </h2>
                    </div>

                    <p className="text-xs text-[rgb(var(--muted))] mb-3">
                        هكذا سيظهر الإشعار في جرس وقائمة إشعارات العميل داخل لوحة التحكم:
                    </p>

                    {/* Preview Box */}
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] p-4 shadow-sm flex-1 flex flex-col justify-center">
                        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', typeConfigs[type].bg, typeConfigs[type].text)}>
                                    {React.createElement(typeConfigs[type].icon, { className: 'size-4' })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-[rgb(var(--brand-950))]">
                                            {title.trim() || 'عنوان الإشعار يظهر هنا'}
                                        </p>
                                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                    </div>
                                    <p className="mt-1 text-xs text-[rgb(var(--muted))] leading-relaxed">
                                        {body.trim() || 'نص وتفاصيل الإشعار ستظهر للمستخدم بهذا التنسيق الأنيق والواضح.'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[rgb(var(--subtle))]">
                                        <Clock className="size-3" />
                                        <span>الآن · إدارة المنصة</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {sendWhatsApp ? (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
                                <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
                                <span>سيتم إرسال رسالة واتساب أيضاً إلى هاتف العميل.</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Broadcast History Table */}
            <div className="admin-panel p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgb(var(--border))]">
                    <Clock className="size-5 text-[rgb(var(--brand-700))]" />
                    <h2 className="text-base font-extrabold text-[rgb(var(--brand-950))]">
                        سجل الإشعارات الجماعية السابقة ({recent_broadcasts.length})
                    </h2>
                </div>

                {recent_broadcasts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[rgb(var(--muted))]">
                        لم يتم إرسال أي إشعارات جماعية سابقة بعد.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border))] text-[rgb(var(--muted))]">
                                    <th className="py-2.5 px-3 text-start font-bold">العنوان</th>
                                    <th className="py-2.5 px-3 text-start font-bold">النوع</th>
                                    <th className="py-2.5 px-3 text-start font-bold">الفئة المستهدفة</th>
                                    <th className="py-2.5 px-3 text-start font-bold">المستلمون</th>
                                    <th className="py-2.5 px-3 text-start font-bold">واتساب</th>
                                    <th className="py-2.5 px-3 text-start font-bold">المرسل والتاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--border))]">
                                {recent_broadcasts.map((item) => (
                                    <tr key={item.id} className="hover:bg-[rgb(var(--surface-soft))] transition">
                                        <td className="py-3 px-3 font-bold text-[rgb(var(--brand-950))]">
                                            {item.title}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-[rgb(var(--muted))]">
                                            {item.target_audience === 'all'
                                                ? 'الجميع'
                                                : item.target_audience === 'active_subscribers'
                                                  ? 'المشتركون'
                                                  : 'التجريبي'}
                                        </td>
                                        <td className="py-3 px-3 font-bold text-emerald-700">
                                            {item.recipients_count} مستخدم
                                        </td>
                                        <td className="py-3 px-3">
                                            {item.whatsapp_sent > 0 ? (
                                                <span className="text-emerald-600 font-bold">
                                                    ✓ {item.whatsapp_sent}
                                                </span>
                                            ) : (
                                                <span className="text-[rgb(var(--muted))]">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-[rgb(var(--muted))]">
                                            {item.sender} · {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
