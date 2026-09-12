import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { 
    Megaphone, 
    ArrowRight, 
    ShieldCheck, 
    Smartphone, 
    Users, 
    Shuffle, 
    Clock, 
    Send,
    Loader2
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import TenantShell from '@/Layouts/TenantShell';

type DeviceOption = {
    id: number;
    ulid: string;
    display_name: string | null;
    phone_e164: string | null;
};

type Group = {
    id: number;
    name: string;
    contacts_count?: number;
};

type Props = {
    devices: DeviceOption[];
    groups: Group[];
};

export default function CampaignsCreate({ devices, groups }: Props) {
    const [name, setName] = useState('');
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>(
        devices.length > 0 ? [devices[0].ulid] : []
    );
    const [targetType, setTargetType] = useState<'group' | 'manual'>('group');
    const [groupId, setGroupId] = useState(groups[0]?.id ? String(groups[0].id) : '');
    const [manualNumbers, setManualNumbers] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');
    const [minDelay, setMinDelay] = useState(5);
    const [maxDelay, setMaxDelay] = useState(15);
    const [spintaxPreview, setSpintaxPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function toggleDevice(deviceUlid: string) {
        if (selectedDeviceIds.includes(deviceUlid)) {
            if (selectedDeviceIds.length > 1) {
                setSelectedDeviceIds(selectedDeviceIds.filter((id) => id !== deviceUlid));
            }
        } else {
            setSelectedDeviceIds([...selectedDeviceIds, deviceUlid]);
        }
    }

    function previewSpintax() {
        if (!messageTemplate) return;
        const processed = messageTemplate
            .replace(/\{([^{}]+)\}/g, (_, choices) => {
                const arr = choices.split('|');
                return arr[Math.floor(Math.random() * arr.length)] || '';
            })
            .replace('{name}', 'أحمد محمد');
        setSpintaxPreview(processed);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (selectedDeviceIds.length === 0 || !name || !messageTemplate) return;

        setSubmitting(true);
        router.post('/campaigns', {
            name,
            device_ids: selectedDeviceIds,
            group_id: targetType === 'group' ? groupId : null,
            manual_numbers: targetType === 'manual' ? manualNumbers : null,
            message_template: messageTemplate,
            min_delay_seconds: minDelay,
            max_delay_seconds: maxDelay,
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <TenantShell
            title="إنشاء حملة إرسال جماعي جديدة"
            description="قم بإعداد حملتك التسويقية وضبط إعدادات حماية الحظر والفواصل الزمنية بين الرسائل"
        >
            <div className="mb-4">
                <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]">
                    <ArrowRight className="h-4 w-4" />
                    العودة لقائمة الحملات
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                {/* 1. Basic Info */}
                <TenantPanel title="1. معلومات الحملة الأساسية">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5">
                                اسم الحملة
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="مثال: عروض نهاية الأسبوع / إشعار تجديد الاشتراك"
                                required
                            />
                        </div>

                        {/* Multi-Device Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                                    أجهزة الإرسال (توزيع تناوبي Round-Robin)
                                </label>
                                <span className="text-xs text-emerald-600 font-medium">
                                    تم تحديد {selectedDeviceIds.length} من {devices.length} أجهزة
                                </span>
                            </div>
                            {devices.length === 0 ? (
                                <p className="text-sm text-rose-500">لا توجد أجهزة متصلة حالياً. يرجى ربط جهاز أولاً.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {devices.map((d) => {
                                        const isChecked = selectedDeviceIds.includes(d.ulid);
                                        return (
                                            <div
                                                key={d.ulid}
                                                onClick={() => toggleDevice(d.ulid)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                    isChecked
                                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                        : 'border-[rgb(var(--border))] hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                        <Smartphone className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[rgb(var(--foreground))]">{d.display_name || 'جهاز واتساب'}</p>
                                                        <p className="text-xs font-mono text-[rgb(var(--muted))]" dir="ltr">{d.phone_e164 || d.ulid.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 pointer-events-none"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </TenantPanel>

                {/* 2. Target Audience */}
                <TenantPanel title="2. الجمهور المستهدف">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <input
                                    type="radio"
                                    name="targetType"
                                    checked={targetType === 'group'}
                                    onChange={() => setTargetType('group')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                اختيار مجموعة من جهات الاتصال
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <input
                                    type="radio"
                                    name="targetType"
                                    checked={targetType === 'manual'}
                                    onChange={() => setTargetType('manual')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                إدخال أرقام يدوياً
                            </label>
                        </div>

                        {targetType === 'group' ? (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5">
                                    المجموعة
                                </label>
                                <select
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                    {groups.length === 0 ? (
                                        <option value="">لا توجد مجموعات - يرجى إنشاء مجموعة من صفحة جهات الاتصال</option>
                                    ) : (
                                        groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name} ({g.contacts_count ?? 0} جهة اتصال)
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5">
                                    الأرقام (رقم في كل سطر أو مفصولة بفواصل مع المفتاح الدولي)
                                </label>
                                <Textarea
                                    dir="ltr"
                                    value={manualNumbers}
                                    onChange={(e) => setManualNumbers(e.target.value)}
                                    placeholder="+966500000000&#10;+966511111111&#10;+963900000000"
                                    rows={5}
                                    className="font-mono text-sm"
                                    required={targetType === 'manual'}
                                />
                            </div>
                        )}
                    </div>
                </TenantPanel>

                {/* 3. Message Template & Spintax */}
                <TenantPanel title="3. محتوى وقالب الرسالة">
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                                    نص الرسالة (يدعم المتغيرات والـ Spintax)
                                </label>
                                <button
                                    type="button"
                                    onClick={previewSpintax}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                                >
                                    <Shuffle className="h-3.5 w-3.5" />
                                    معاينة تنويع النص عشوائياً
                                </button>
                            </div>

                            <Textarea
                                value={messageTemplate}
                                onChange={(e) => {
                                    setMessageTemplate(e.target.value);
                                    setSpintaxPreview(null);
                                }}
                                placeholder="{مرحباً|أهلاً بك|السلام عليكم} عزيزنا {name}، يسعدنا إعلامك ببدء العروض الحصرية لهذا الأسبوع!"
                                rows={5}
                                required
                            />

                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                                <span className="p-1 rounded bg-[rgb(var(--muted))]/10"><code>{'{name}'}</code> لاسم العميل</span>
                                <span className="p-1 rounded bg-[rgb(var(--muted))]/10"><code>{'{خيار1|خيار2|خيار3}'}</code> لتنويع العبارات تلقائياً</span>
                            </div>

                            {spintaxPreview && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                    <p className="font-semibold text-slate-500 mb-1">نموذج لرسالة عشوائية ستصل لأحد المستلمين:</p>
                                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{spintaxPreview}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TenantPanel>

                {/* 4. Anti-Ban Delay Protection */}
                <TenantPanel title="4. إعدادات حماية الحظر والفواصل الزمنية">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                <p className="font-bold mb-1">حماية ضد الحظر التلقائي (Anti-Ban Engine):</p>
                                سيقوم النظام بإرسال الرسائل بفواصل زمنية عشوائية ذكية بين كل رسالة والأخرى، مع توزيع الحمل على كافة الأجهزة المحددة بالتناوب لضمان أعلى استقرار.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    أقل فاصل زمني (بالثواني)
                                </label>
                                <Input
                                    type="number"
                                    min={2}
                                    max={60}
                                    value={minDelay}
                                    onChange={(e) => setMinDelay(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1.5 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    أقصى فاصل زمني (بالثواني)
                                </label>
                                <Input
                                    type="number"
                                    min={3}
                                    max={120}
                                    value={maxDelay}
                                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </TenantPanel>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/campaigns">
                        <Button type="button" variant="secondary">إلغاء</Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={submitting || selectedDeviceIds.length === 0 || !name || !messageTemplate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 px-6"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        إطلاق الحملة الآن في الخلفية
                    </Button>
                </div>
            </form>
        </TenantShell>
    );
}
