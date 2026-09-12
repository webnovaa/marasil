import { FormEvent, useState } from 'react';
import {
    ShoppingBag,
    Check,
    Copy,
    Send,
    Code,
    Zap,
    ExternalLink,
    Smartphone,
    RefreshCw,
    Sparkles,
    CheckCircle2,
    Sliders,
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import TenantShell from '@/Layouts/TenantShell';

type EventRecipe = {
    name: string;
    template: string;
};

type PlatformItem = {
    id: string;
    name: string;
    badge: string;
    description: string;
    events: EventRecipe[];
};

type DeviceOption = {
    id: number;
    ulid: string;
    display_name: string | null;
    phone_e164: string | null;
};

type Props = {
    platforms: PlatformItem[];
    devices: DeviceOption[];
    webhookUrl: string;
};

export default function IntegrationsIndex({ platforms, devices, webhookUrl }: Props) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [activeTab, setActiveTab] = useState(platforms[0]?.id || 'salla');

    // Simulation Modal
    const [simModalOpen, setSimModalOpen] = useState(false);
    const [simEvent, setSimEvent] = useState<EventRecipe | null>(null);
    const [simPhone, setSimPhone] = useState(devices[0]?.phone_e164 || '');
    const [simTemplate, setSimTemplate] = useState('');
    const [simDevice, setSimDevice] = useState(devices[0]?.ulid || '');
    const [simulating, setSimulating] = useState(false);
    const [simResult, setSimResult] = useState<{ success?: boolean; message?: string; rendered?: string } | null>(null);

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    }

    function openSimulator(recipe: EventRecipe) {
        setSimEvent(recipe);
        setSimTemplate(recipe.template);
        setSimResult(null);
        setSimModalOpen(true);
    }

    async function handleSimulate(e: FormEvent) {
        e.preventDefault();
        if (!simPhone.trim() || simulating) return;

        setSimulating(true);
        setSimResult(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/integrations/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    phone: simPhone,
                    platform: activeTab,
                    event: simEvent?.name || 'test',
                    custom_text: simTemplate,
                    device_id: simDevice || null,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSimResult({
                    success: true,
                    message: 'تم إرسال رسالة المحاكاة بنجاح عبر الواتساب!',
                    rendered: data.rendered_message,
                });
            } else {
                setSimResult({
                    success: false,
                    message: data.error || 'تعذر إرسال رسالة التجربة.',
                });
            }
        } catch {
            setSimResult({
                success: false,
                message: 'حدث خطأ في الاتصال بالخادم.',
            });
        } finally {
            setSimulating(false);
        }
    }

    const currentPlatform = platforms.find((p) => p.id === activeTab) || platforms[0];

    return (
        <TenantShell title="الربط والتكامل">
            <div className="space-y-6">
                <TenantPanel
                    title="مركز التكامل والربط مع المتاجر الإلكترونية"
                    description="اربط متجرك على سلة أو زد أو ووكومرس أو شوبيفاي لإرسال إشعارات الواتساب التلقائية للطلبات، الشحن، السلات المتروكة، ورموز التحقق."
                >
                    {/* Webhook Endpoint Banner */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <h4 className="font-bold text-sm text-foreground">رابط الويب هوك الخاص بحسابك (Webhook URL)</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ضعه في إعدادات Webhooks في متجرك الإلكتروني (سلة، زد، وغيرها) لتلقي الأحداث فوراً.
                            </p>
                            <code className="inline-block font-mono text-xs bg-card px-3 py-1.5 rounded-lg border border-border/70 text-emerald-700 dark:text-emerald-300" dir="ltr">
                                {webhookUrl}
                            </code>
                        </div>
                        <Button
                            type="button"
                            onClick={() => copyToClipboard(webhookUrl)}
                            className="h-10 text-xs font-semibold shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {copiedUrl ? (
                                <>
                                    <Check className="h-4 w-4 me-1.5" />
                                    تم النسخ بنجاح!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 me-1.5" />
                                    نسخ رابط الويب هوك
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Platform Selector Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-border/70 pb-3 pt-2">
                        {platforms.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setActiveTab(p.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === p.id
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>{p.name}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                        activeTab === p.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-border/60 text-muted-foreground'
                                    }`}
                                >
                                    {p.badge}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Current Platform Details */}
                    {currentPlatform && (
                        <div className="space-y-6 pt-2">
                            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
                                <h3 className="font-bold text-sm text-foreground mb-1">{currentPlatform.name}</h3>
                                <p className="text-xs text-muted-foreground">{currentPlatform.description}</p>
                            </div>

                            {/* Recipes Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentPlatform.events.map((recipe, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-sm group"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                                    {recipe.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                                                    جاهز للربط
                                                </span>
                                            </div>

                                            <div className="bg-[#efeae2]/50 dark:bg-[#0b141a]/40 p-3 rounded-lg border border-border/50 text-xs font-sans text-foreground leading-relaxed">
                                                {recipe.template}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                                            <span className="text-[10px] text-muted-foreground">
                                                {'متغيرات تلقائية: {customer_name}، {order_id}'}
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={() => openSimulator(recipe)}
                                                className="h-8 text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 transition-colors"
                                            >
                                                <Sparkles className="h-3.5 w-3.5 me-1" />
                                                تجربة المحاكاة
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TenantPanel>

                {/* Simulation Modal */}
                <Dialog open={simModalOpen} onOpenChange={setSimModalOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                <span>تجربة محاكاة إشعار: {simEvent?.name}</span>
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSimulate} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    رقم الهاتف التجريبي لتلقي الإشعار (مع مقدمة الدولة):
                                </label>
                                <Input
                                    type="text"
                                    placeholder="+966500000000"
                                    value={simPhone}
                                    onChange={(e) => setSimPhone(e.target.value)}
                                    className="h-9 text-xs"
                                    dir="ltr"
                                    required
                                />
                            </div>

                            {devices.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        جهاز الواتساب المرسل:
                                    </label>
                                    <select
                                        value={simDevice}
                                        onChange={(e) => setSimDevice(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 text-xs focus:outline-none"
                                    >
                                        {devices.map((d) => (
                                            <option key={d.ulid} value={d.ulid}>
                                                {d.display_name || d.phone_e164}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    نص الرسالة وقالب المتغيرات:
                                </label>
                                <Textarea
                                    rows={4}
                                    value={simTemplate}
                                    onChange={(e) => setSimTemplate(e.target.value)}
                                    className="text-xs leading-relaxed"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    سيتم استبدال المتغيرات تلقائياً ببيانات وهمية لاختبار مظهر الرسالة في واتساب.
                                </p>
                            </div>

                            {simResult && (
                                <div
                                    className={`p-3 rounded-xl text-xs space-y-1 ${
                                        simResult.success
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                    }`}
                                >
                                    <div className="font-semibold flex items-center gap-1.5">
                                        {simResult.success && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                        {simResult.message}
                                    </div>
                                    {simResult.rendered && (
                                        <div className="text-[11px] opacity-90 font-mono bg-card p-2 rounded mt-1 border border-border/40">
                                            {simResult.rendered}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSimModalOpen(false)}
                                    className="h-9 text-xs"
                                >
                                    إغلاق
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={simulating || !simPhone.trim()}
                                    className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {simulating ? (
                                        <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin me-1.5" />
                                            جارٍ الإرسال...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5 me-1.5 -scale-x-100" />
                                            إرسال التجربة الآن
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </TenantShell>
    );
}
