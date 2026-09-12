import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    Bot, 
    Plus, 
    Power, 
    Trash2, 
    MessageSquare, 
    Smartphone, 
    Zap,
    Hash
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import TenantShell from '@/Layouts/TenantShell';

type DeviceOption = {
    id: number;
    ulid: string;
    display_name: string | null;
    phone_e164: string | null;
};

type AutoReply = {
    id: number;
    ulid: string;
    name: string;
    trigger_type: 'exact' | 'contains' | 'starts_with' | 'welcome';
    trigger_keyword: string | null;
    reply_text: string;
    is_active: boolean;
    reply_count: number;
    device: DeviceOption | null;
    created_at: string;
};

type Props = {
    autoReplies: AutoReply[];
    devices: DeviceOption[];
};

export default function AutoRepliesIndex({ autoReplies, devices }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [triggerType, setTriggerType] = useState<'contains' | 'exact' | 'starts_with' | 'welcome'>('contains');
    const [triggerKeyword, setTriggerKeyword] = useState('');
    const [replyText, setReplyText] = useState('');

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        router.post('/auto-replies', {
            name,
            device_id: deviceId || null,
            trigger_type: triggerType,
            trigger_keyword: triggerType === 'welcome' ? null : triggerKeyword,
            reply_text: replyText,
        }, {
            onSuccess: () => {
                setCreateOpen(false);
                setName('');
                setTriggerKeyword('');
                setReplyText('');
            },
        });
    }

    function handleToggle(id: number) {
        router.post(`/auto-replies/${id}/toggle`);
    }

    function handleDelete(id: number) {
        if (confirm('هل أنت متأكد من حذف قاعدة الرد التلقائي هذه؟')) {
            router.delete(`/auto-replies/${id}`);
        }
    }

    function triggerLabel(type: string) {
        switch (type) {
            case 'exact': return 'تطابق تام للكلمة';
            case 'contains': return 'تحتوي على الكلمة';
            case 'starts_with': return 'تبدأ بالكلمة';
            case 'welcome': return 'ترحيب بأول محادثة';
            default: return type;
        }
    }

    return (
        <TenantShell
            title="الرد التلقائي الذكي (Auto-Reply)"
            description="قم بإعداد روبوت محادثة فوري للرد على استفسارات الزبائن والترحيب بهم فور إرسالهم كلمات محددة"
            headerActions={
                <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4" />
                    إضافة قاعدة رد جديدة
                </Button>
            }
        >
            <TenantPanel title={`قواعد الرد التلقائي النشطة (${autoReplies.length})`} flush>
                {autoReplies.length === 0 ? (
                    <TenantEmptyState
                        icon={Bot}
                        title="لا توجد قواعد رد تلقائي حتى الآن"
                        description="أنشئ قاعدتك الأولى للرد التلقائي عندما يسأل العملاء عن (الأسعار، ساعات العمل، أو رسالة ترحيبية)."
                    />
                ) : (
                    <div className="divide-y divide-[rgb(var(--border))]">
                        {autoReplies.map((rule) => (
                            <div key={rule.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[rgb(var(--muted))]/5 transition-colors">
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-base text-[rgb(var(--foreground))]">{rule.name}</p>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                            {triggerLabel(rule.trigger_type)}
                                        </span>
                                        {rule.trigger_keyword && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                <Hash className="h-3 w-3" />
                                                "{rule.trigger_keyword}"
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--muted))]">
                                            <Smartphone className="h-3.5 w-3.5" />
                                            {rule.device ? rule.device.display_name || rule.device.phone_e164 : 'كل الأجهزة'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-[rgb(var(--muted))] whitespace-pre-wrap line-clamp-2 bg-[rgb(var(--muted))]/5 p-2 rounded-lg border border-[rgb(var(--border))]">
                                        {rule.reply_text}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))] pt-1">
                                        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                            <Zap className="h-3.5 w-3.5" />
                                            تم الرد {rule.reply_count} مرة
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    <Button
                                        size="sm"
                                        variant={rule.is_active ? 'secondary' : 'primary'}
                                        onClick={() => handleToggle(rule.id)}
                                        className={`gap-1.5 text-xs ${rule.is_active ? 'text-emerald-600' : 'opacity-70'}`}
                                    >
                                        <Power className="h-3.5 w-3.5" />
                                        {rule.is_active ? 'نشط' : 'معطل'}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2 text-[rgb(var(--muted))] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </TenantPanel>

            {/* Modal: Create Rule */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-emerald-600" />
                            إنشاء قاعدة رد تلقائي جديدة
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">اسم القاعدة</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الاستفسار عن الأسعار أو الدوام" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">نوع التحفيز</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value as never)}
                                    className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm"
                                >
                                    <option value="contains">تحتوي على الكلمة</option>
                                    <option value="exact">تطابق تام للكلمة</option>
                                    <option value="starts_with">تبدأ بالكلمة</option>
                                    <option value="welcome">رسالة ترحيبية بأول رسالة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">الجهاز المخصص</label>
                                <select
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm"
                                >
                                    <option value="">جميع الأجهزة المتصلة</option>
                                    {devices.map((d) => (
                                        <option key={d.id} value={d.id}>{d.display_name || d.phone_e164}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {triggerType !== 'welcome' && (
                            <div>
                                <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">الكلمة المفتاحية المحفزة</label>
                                <Input value={triggerKeyword} onChange={(e) => setTriggerKeyword(e.target.value)} placeholder="مثال: سعر، مساعدة، دوام" required />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--muted))] mb-1">نص الرد التلقائي (يدعم Spintax)</label>
                            <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="مثال: {أهلاً بك|مرحباً}! أوقات العمل لدينا من 9 صباحاً حتى 6 مساءً."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">حفظ القاعدة</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </TenantShell>
    );
}
