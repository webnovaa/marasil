import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Code2,
    Copy,
    Check,
    Smartphone,
    Palette,
    Eye,
    Sparkles,
    RefreshCw,
    ExternalLink,
    CheckCircle2,
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import TenantShell from '@/Layouts/TenantShell';

type WidgetSetting = {
    phone_number: string | null;
    brand_name: string;
    greeting_message: string | null;
    welcome_popup_text: string | null;
    button_color: string;
    position: 'bottom-right' | 'bottom-left';
    is_active: boolean;
};

type DeviceOption = {
    id: number;
    ulid: string;
    display_name: string | null;
    phone_e164: string | null;
};

type Props = {
    setting: WidgetSetting;
    devices: DeviceOption[];
    scriptUrl: string;
    tenantUlid: string;
};

const PRESET_COLORS = [
    { label: 'أخضر واتساب', value: '#25D366' },
    { label: 'تيل كلاسيكي', value: '#008069' },
    { label: 'أزرق ملكي', value: '#0284c7' },
    { label: 'بنفسجي عصري', value: '#8b5cf6' },
    { label: 'أسود أنيق', value: '#18181b' },
];

export default function WidgetIndex({ setting, devices, scriptUrl, tenantUlid }: Props) {
    const [phone, setPhone] = useState(setting.phone_number || (devices[0]?.phone_e164 ?? ''));
    const [brandName, setBrandName] = useState(setting.brand_name || 'خدمة العملاء');
    const [greeting, setGreeting] = useState(
        setting.greeting_message || 'مرحباً بك! 👋 كيف يمكننا مساعدتك اليوم عبر واتساب؟'
    );
    const [welcomeText, setWelcomeText] = useState(
        setting.welcome_popup_text || 'فريقنا متاح للرد الفوري على استفساراتك'
    );
    const [buttonColor, setButtonColor] = useState(setting.button_color || '#25D366');
    const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(
        setting.position || 'bottom-right'
    );
    const [isActive, setIsActive] = useState(setting.is_active);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Live preview popup state
    const [previewPopupOpen, setPreviewPopupOpen] = useState(true);

    const embedCode = `<script\n  src="${scriptUrl}"\n  data-phone="${phone}"\n  data-brand="${brandName}"\n  data-greeting="${greeting}"\n  data-color="${buttonColor}"\n  data-position="${position}"\n  defer\n></script>`;

    function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post(
            '/widget',
            {
                phone_number: phone,
                brand_name: brandName,
                greeting_message: greeting,
                welcome_popup_text: welcomeText,
                button_color: buttonColor,
                position: position,
                is_active: isActive,
            },
            {
                onFinish: () => setSaving(false),
            }
        );
    }

    function copyEmbedCode() {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <TenantShell title="ودجت الواتساب">
            <div className="space-y-6">
                <TenantPanel
                    title="ودجت الواتساب العائم للمواقع والمتاجر"
                    description="خصص زر محادثة واتساب عائم وأنيق لموقعك الإلكتروني أو متجرك، ليتمكن زوارك من التواصل معك بنقرة واحدة عبر أجهزتك المربوطة."
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Customizer Form (7 Cols) */}
                        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
                            {/* Enable Toggle Card */}
                            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
                                <div className="space-y-0.5">
                                    <h3 className="font-semibold text-foreground text-sm">حالة الودجت</h3>
                                    <p className="text-xs text-muted-foreground">
                                        تفعيل أو تعطيل ظهور الزر العائم على موقعك.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsActive(!isActive)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        isActive ? 'bg-emerald-600' : 'bg-muted'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            isActive ? '-translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Phone & Brand Fields */}
                            <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            رقم الواتساب المستلم للمحادثات:
                                        </label>
                                        {devices.length > 0 && (
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Smartphone className="h-3 w-3 text-emerald-500" />
                                                اختر من أجهزتك المتصلة
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            placeholder="+966500000000"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-9 text-xs"
                                            dir="ltr"
                                            required
                                        />
                                        {devices.length > 0 && (
                                            <select
                                                onChange={(e) => e.target.value && setPhone(e.target.value)}
                                                className="h-9 rounded-lg border border-border/80 bg-background px-2 text-xs focus:outline-none"
                                            >
                                                <option value="">اختر جهاز</option>
                                                {devices.map((d) => (
                                                    <option key={d.ulid} value={d.phone_e164 || ''}>
                                                        {d.display_name || d.phone_e164}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        اسم النشاط التجاري أو فريق الدعم:
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="مثلاً: خدمة عملاء مراسيل"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        الرسالة الترحيبية المعروضة داخل نافذة الودجت:
                                    </label>
                                    <Textarea
                                        rows={2}
                                        value={greeting}
                                        onChange={(e) => setGreeting(e.target.value)}
                                        className="text-xs leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Style & Colors */}
                            <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm space-y-4">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-emerald-500" />
                                    لون الزر وموضعه على الشاشة
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setButtonColor(c.value)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                                buttonColor === c.value
                                                    ? 'border-foreground font-bold shadow-sm'
                                                    : 'border-border/60 hover:border-border'
                                            }`}
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full shadow-inner"
                                                style={{ backgroundColor: c.value }}
                                            />
                                            <span>{c.label}</span>
                                        </button>
                                    ))}
                                    <input
                                        type="color"
                                        value={buttonColor}
                                        onChange={(e) => setButtonColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-border/80 p-0 cursor-pointer"
                                        title="لون مخصص"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setPosition('bottom-right')}
                                        className={`p-3 rounded-xl border text-xs text-center transition-all ${
                                            position === 'bottom-right'
                                                ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                                : 'border-border/60 hover:bg-muted/40'
                                        }`}
                                    >
                                        أسفل اليمين (موصى به للمواقع العربية)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPosition('bottom-left')}
                                        className={`p-3 rounded-xl border text-xs text-center transition-all ${
                                            position === 'bottom-left'
                                                ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                                : 'border-border/60 hover:bg-muted/40'
                                        }`}
                                    >
                                        أسفل اليسار (للمواقع الإنجليزية)
                                    </button>
                                </div>
                            </div>

                            {/* Embed Code Snippet */}
                            <div className="rounded-xl border border-border/80 bg-muted/30 p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Code2 className="h-4 w-4 text-emerald-500" />
                                        كود التضمين في موقعك (Embed Snippet)
                                    </label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={copyEmbedCode}
                                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 me-1" />
                                                تم النسخ!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5 me-1" />
                                                نسخ الكود
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <pre className="p-3.5 rounded-lg bg-card border border-border/70 text-xs font-mono text-foreground overflow-x-auto" dir="ltr">
                                    {embedCode}
                                </pre>
                                <p className="text-[11px] text-muted-foreground">
                                    انسخ هذا الكود والصقه قبل وسم <code className="font-mono text-emerald-600">&lt;/body&gt;</code> في متجر سلة، زد، ووكومرس، شوبيفاي، أو أي صفحة HTML.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin me-2" />
                                        جارٍ حفظ التعديلات...
                                    </>
                                ) : (
                                    'حفظ الإعدادات'
                                )}
                            </Button>
                        </form>

                        {/* Live Interactive Preview Canvas (5 Cols) */}
                        <div className="lg:col-span-5 flex flex-col h-[640px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg">
                            <div className="bg-muted/40 p-3 border-b border-border/70 flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 text-emerald-500" />
                                    معاينة حية وتفاعلية على موقعك
                                </span>
                                <span className="text-muted-foreground text-[10px]">انقر الزر لفتح النافذة</span>
                            </div>

                            {/* Simulated Webpage Canvas */}
                            <div className="flex-1 relative bg-gradient-to-b from-muted/20 to-background p-6 flex flex-col justify-between overflow-hidden">
                                {/* Dummy Website Content */}
                                <div className="space-y-4 opacity-30 select-none pointer-events-none">
                                    <div className="h-6 w-32 bg-foreground/20 rounded-md" />
                                    <div className="h-28 w-full bg-foreground/10 rounded-xl" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="h-20 bg-foreground/10 rounded-lg" />
                                        <div className="h-20 bg-foreground/10 rounded-lg" />
                                    </div>
                                    <div className="h-16 w-full bg-foreground/10 rounded-lg" />
                                </div>

                                {/* Floating Widget in Canvas */}
                                <div
                                    className={`absolute bottom-6 ${
                                        position === 'bottom-left' ? 'left-6' : 'right-6'
                                    } flex flex-col ${
                                        position === 'bottom-left' ? 'items-start' : 'items-end'
                                    } gap-3`}
                                >
                                    {/* Preview Popup Bubble */}
                                    {previewPopupOpen && (
                                        <div className="w-72 rounded-2xl bg-card shadow-2xl border border-border/80 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div
                                                className="p-4 text-white flex items-center gap-3"
                                                style={{ backgroundColor: buttonColor }}
                                            >
                                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">
                                                    💬
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs">{brandName}</h4>
                                                    <p className="text-[10px] text-white/90 flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse" />
                                                        متصل الآن • رد فوري
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 bg-muted/30">
                                                <div className="bg-card p-3 rounded-2xl rounded-ts-none shadow-sm text-xs text-foreground leading-relaxed border border-border/40">
                                                    {greeting}
                                                </div>
                                            </div>

                                            <div className="p-3 border-t border-border/40 bg-card">
                                                <a
                                                    href={`https://wa.me/${phone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(
                                                        greeting
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-2 px-3 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-opacity hover:opacity-90"
                                                    style={{ backgroundColor: buttonColor }}
                                                >
                                                    <span>بدء المحادثة في واتساب</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Floating Button */}
                                    <button
                                        type="button"
                                        onClick={() => setPreviewPopupOpen(!previewPopupOpen)}
                                        className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform relative cursor-pointer"
                                        style={{ backgroundColor: buttonColor }}
                                    >
                                        <span
                                            className="absolute w-full h-full rounded-full animate-ping opacity-30 pointer-events-none"
                                            style={{ backgroundColor: buttonColor }}
                                        />
                                        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.77 14.13c-.24.67-1.39 1.25-1.92 1.33-.51.08-1.17.11-3.37-.8-2.62-1.08-4.32-3.74-4.45-3.91-.13-.18-1.07-1.42-1.07-2.72 0-1.29.68-1.93.92-2.19.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.8.8 1.93.07.13.11.29.02.47-.09.18-.14.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.27-.12.53.15.26.68 1.11 1.45 1.8 1 .89 1.84 1.17 2.1 1.3.26.13.41.11.56-.06.15-.18.66-.77.83-1.03.18-.26.35-.22.59-.13.24.09 1.53.72 1.79.85.26.13.43.2.5.31.07.11.07.65-.17 1.32z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
