import { FormEvent, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import {
    Sparkles,
    Key,
    Bot,
    Send,
    Eye,
    EyeOff,
    CheckCircle2,
    Sliders,
    Zap,
    ExternalLink,
    RefreshCw,
    Lock,
    Crown,
    Building2,
    PackageCheck,
    Clock,
    HelpCircle,
    ShieldAlert,
    ArrowRight,
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Textarea } from '@/Components/ui/Textarea';
import TenantShell from '@/Layouts/TenantShell';

type ModelOption = {
    id: string;
    name: string;
    description: string;
    tag: string;
};

type ToneOption = {
    id: string;
    name: string;
    description: string;
};

type AiSettings = {
    model: string;
    company_name: string;
    company_bio: string;
    products_services: string;
    working_hours: string;
    policies: string;
    system_instruction: string;
    tone: string;
    is_enabled: boolean;
    temperature: number;
    max_tokens: number;
    total_ai_replies: number;
    has_api_key: boolean;
    masked_key: string;
};

type Props = {
    settings: AiSettings;
    models: ModelOption[];
    tones: ToneOption[];
    hasPlanAccess: boolean;
    isMasterEnabled: boolean;
    currentPlanName: string;
};

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
    time: string;
};

export default function AiAssistantIndex({
    settings,
    models,
    tones,
    hasPlanAccess,
    isMasterEnabled,
    currentPlanName,
}: Props) {
    const [apiKey, setApiKey] = useState(settings.has_api_key ? settings.masked_key : '');
    const [showKey, setShowKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(settings.model);
    const [selectedTone, setSelectedTone] = useState(settings.tone);
    const [isEnabled, setIsEnabled] = useState(settings.is_enabled);

    // Company Structured Knowledge Base
    const [companyName, setCompanyName] = useState(settings.company_name);
    const [companyBio, setCompanyBio] = useState(settings.company_bio);
    const [productsServices, setProductsServices] = useState(settings.products_services);
    const [workingHours, setWorkingHours] = useState(settings.working_hours);
    const [policies, setPolicies] = useState(settings.policies);
    const [systemInstruction, setSystemInstruction] = useState(settings.system_instruction);

    const [temperature, setTemperature] = useState(settings.temperature);
    const [maxTokens, setMaxTokens] = useState(settings.max_tokens);
    const [saving, setSaving] = useState(false);

    // Live Simulator State
    const [testInput, setTestInput] = useState('');
    const [simulating, setSimulating] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            role: 'model',
            text: `مرحباً بك! أنا مساعدك الذكي عبر Google Gemini لصالح (${companyName || 'منشأتك'}). اكتب أي استفسار لتجربة كيف سأرد على عملائك بدقة بناءً على بياناتك!`,
            time: 'الآن',
        },
    ]);

    function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post(
            '/ai-assistant',
            {
                gemini_api_key: apiKey,
                model: selectedModel,
                company_name: companyName,
                company_bio: companyBio,
                products_services: productsServices,
                working_hours: workingHours,
                policies: policies,
                system_instruction: systemInstruction,
                tone: selectedTone,
                is_enabled: isEnabled,
                temperature: temperature,
                max_tokens: maxTokens,
            },
            {
                onFinish: () => setSaving(false),
            }
        );
    }

    async function handleTestSend(e: FormEvent) {
        e.preventDefault();
        if (!testInput.trim() || simulating) return;

        const userMsg = testInput.trim();
        const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        setChatHistory((prev) => [...prev, { role: 'user', text: userMsg, time: now }]);
        setTestInput('');
        setSimulating(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/ai-assistant/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    message: userMsg,
                    gemini_api_key: apiKey,
                    model: selectedModel,
                    company_name: companyName,
                    company_bio: companyBio,
                    products_services: productsServices,
                    working_hours: workingHours,
                    policies: policies,
                    system_instruction: systemInstruction,
                    tone: selectedTone,
                }),
            });

            const data = await res.json();
            const replyTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            if (res.ok && data.reply) {
                setChatHistory((prev) => [...prev, { role: 'model', text: data.reply, time: replyTime }]);
            } else {
                setChatHistory((prev) => [
                    ...prev,
                    {
                        role: 'model',
                        text: data.reply || data.error || 'حدث خطأ أثناء المحاكاة. تأكد من إعداد مفتاح API بشكل صحيح.',
                        time: replyTime,
                    },
                ]);
            }
        } catch {
            setChatHistory((prev) => [
                ...prev,
                { role: 'model', text: 'تعذر الاتصال بالخادم لاختبار المساعد الذكي.', time: 'خطأ' },
            ]);
        } finally {
            setSimulating(false);
        }
    }

    // IF TENANT PLAN DOES NOT HAVE AI FEATURE: RENDER UPGRADE LOCK GATE
    if (!hasPlanAccess) {
        return (
            <TenantShell title="المساعد الذكي (Gemini AI)">
                <div className="space-y-6">
                    <TenantPanel
                        title="المساعد الذكي (Google Gemini AI)"
                        description="خدمة الردود الآلية الذكية وتوليد المحادثات عبر أقوى نماذج الذكاء الاصطناعي من Google."
                    >
                        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-card via-amber-500/5 to-card p-8 md:p-12 text-center shadow-xl space-y-6 max-w-3xl mx-auto">
                            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                <Crown className="h-10 w-10" />
                            </div>

                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                    <Lock className="h-3 w-3" />
                                    ميزة حصرية بالخطة الاحترافية (Professional)
                                </span>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                                    المساعد الذكي Google Gemini مخصص للباقة الاحترافية
                                </h2>
                                <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                                    باقتك الحالية هي ({currentPlanName}). قم بالترقية الآن إلى الخطة الاحترافية لتفعيل روبوت المحادثة فائق الذكاء الذي يجيب على عملائك 24/7 بدقة كاملة مستنداً إلى نشاطك التجاري.
                                </p>
                            </div>

                            {/* Features highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start pt-4">
                                <div className="p-4 rounded-2xl border border-border/70 bg-card/80 space-y-1">
                                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                        ردود فورية على مدار الساعة
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        استجابة خلال ثوانٍ لأي استفسار عبر واتساب دون تأخير وبأسلوب بشري طبيعي.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl border border-border/70 bg-card/80 space-y-1">
                                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-emerald-500" />
                                        قاعدة معرفة متخصصة بمتجرك
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        المودل يرد حصراً بناءً على تعريف شركتك، منتجاتك، أسعارك وساعات عملك.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl border border-border/70 bg-card/80 space-y-1">
                                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-sky-500" />
                                        توفير تكاليف خدمة العملاء
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        تغطية أكثر من 80% من استفسارات العملاء الروتينية والمتكررة تلقائياً.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl border border-border/70 bg-card/80 space-y-1">
                                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-purple-500" />
                                        دعم نماذج Gemini 2.0 & Pro
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        وصول غير محدود لأحدث طرازات الذكاء الاصطناعي التوليدي من Google.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href="/plans"
                                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>ترقية الخطة الآن إلى الاحترافية</span>
                                    <ArrowRight className="h-4 w-4 -scale-x-100" />
                                </Link>
                                <Link
                                    href="/tenant"
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors"
                                >
                                    العودة للوحة التحكم
                                </Link>
                            </div>
                        </div>
                    </TenantPanel>
                </div>
            </TenantShell>
        );
    }

    return (
        <TenantShell title="المساعد الذكي (Gemini AI)">
            <div className="space-y-6">
                {!isMasterEnabled && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                            <span className="font-bold">تنبيه من إدارة المنصة:</span> خدمة الذكاء الاصطناعي متوقفة مؤقتاً لأعمال الصيانة والتطوير. سيتم استئناف الردود التلقائية قريباً.
                        </div>
                    </div>
                )}

                <TenantPanel
                    title="المساعد الذكي (Google Gemini AI)"
                    description="اربط نموذج Google Gemini المتقدم ليرد تلقائياً على استفسارات عملائك عبر واتساب بناءً على النبذة وقواعد العمل التي تحددها لشركتك بدقة متناهية."
                    action={
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                                {settings.total_ai_replies} رد ذكي تم تنفيذه
                            </span>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Settings Form (7 Columns) */}
                        <form onSubmit={handleSave} className="space-y-6 lg:col-span-7">
                            {/* Enable Toggle Card */}
                            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:bg-card">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">تفعيل الرد التلقائي عبر الذكاء الاصطناعي</h3>
                                        {isEnabled ? (
                                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                نشط الآن
                                            </span>
                                        ) : (
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                متوقف
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        عند التفعيل، سيقوم Gemini بالرد الذكي الفوري على أي رسالة واردة لا تطابق الردود الثابتة.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEnabled(!isEnabled)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isEnabled ? 'bg-emerald-600' : 'bg-muted'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            isEnabled ? '-translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* API Key Box */}
                            <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Key className="h-4 w-4 text-emerald-500" />
                                        مفتاح Google Gemini API Key
                                    </label>
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                                    >
                                        احصل على المفتاح مجاناً من Google AI Studio
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="AIzaSy..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="pe-10 font-mono text-sm"
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {settings.has_api_key && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        تم حفظ المفتاح بأمان ومشفّر بالكامل بقاعدة البيانات.
                                    </div>
                                )}
                            </div>

                            {/* Model Selector */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Bot className="h-4 w-4 text-emerald-500" />
                                    اختر نموذج الذكاء الاصطناعي
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSelectedModel(m.id)}
                                            className={`flex flex-col text-start rounded-xl border p-4 transition-all ${
                                                selectedModel === m.id
                                                    ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                                                    : 'border-border/80 bg-card/40 hover:bg-card hover:border-border'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className="text-xs font-semibold text-foreground">{m.name.split(' ')[0]}</span>
                                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    {m.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                                                {m.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone Selector */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-emerald-500" />
                                    نبرة الرد وأسلوب المحادثة
                                </label>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                    {tones.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setSelectedTone(t.id)}
                                            className={`rounded-xl border p-3 text-center transition-all ${
                                                selectedTone === t.id
                                                    ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border/70 bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold">{t.name}</div>
                                            <div className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-1">{t.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* STRUCTURED COMPANY DEFINITION & KNOWLEDGE BASE */}
                            <div className="rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-sm space-y-5">
                                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <h3 className="font-bold text-sm text-foreground">
                                            تعريف الشركة وقاعدة المعرفة (Company Knowledge Base)
                                        </h3>
                                    </div>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                        أساس ردود المودل
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    سيعتمد نموذج جيميني حصراً على هذه الأقسام للرد على استفسارات عملائك ولن يخترع معلومات خارجها.
                                </p>

                                {/* 1. Company Name & Bio */}
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">اسم المتجر أو المنشأة:</label>
                                        <Input
                                            type="text"
                                            placeholder="مثلاً: شركة ومتاجر مراسيل للحلول الذكية"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            نبذة عن الشركة ونشاطها (من نحن وماذا نقدم):
                                        </label>
                                        <Textarea
                                            rows={3}
                                            placeholder="اكتب هنا من أنتم، مجال عملكم، وما يميز خدماتكم..."
                                            value={companyBio}
                                            onChange={(e) => setCompanyBio(e.target.value)}
                                            className="text-xs leading-relaxed"
                                        />
                                    </div>
                                </div>

                                {/* 2. Products, Services & Pricing */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                        المنتجات والخدمات وقوائم الأسعار (Products & Pricing):
                                    </label>
                                    <Textarea
                                        rows={4}
                                        placeholder="اذكر أبرز المنتجات، الباقات، الأسعار، العروض الحالية، وكوبونات الخصم إن وجدت..."
                                        value={productsServices}
                                        onChange={(e) => setProductsServices(e.target.value)}
                                        className="text-xs leading-relaxed"
                                    />
                                </div>

                                {/* 3. Working Hours & Delivery */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        أوقات العمل ومناطق التغطية والشحن:
                                    </label>
                                    <Textarea
                                        rows={2}
                                        placeholder="مثلاً: نعمل من الأحد إلى الخميس من 9 ص حتى 10 م. الشحن متاح لجميع مناطق المملكة خلال 2-3 أيام عمل..."
                                        value={workingHours}
                                        onChange={(e) => setWorkingHours(e.target.value)}
                                        className="text-xs leading-relaxed"
                                    />
                                </div>

                                {/* 4. Policies & Handover */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        سياسات المتجر والتحويل لممثل خدمة العملاء:
                                    </label>
                                    <Textarea
                                        rows={2}
                                        placeholder="شروط الاسترجاع والاستبدال، ورقم الدعم البشري للشكاوى الطارئة..."
                                        value={policies}
                                        onChange={(e) => setPolicies(e.target.value)}
                                        className="text-xs leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Advanced parameters */}
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <Sliders className="h-3.5 w-3.5" />
                                    إعدادات التوليد المتقدمة
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">درجة الإبداع (Temperature):</span>
                                            <span className="font-mono font-semibold">{temperature}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={temperature}
                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                            className="w-full accent-emerald-500 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">الحد الأقصى لطول الرد:</span>
                                            <span className="font-mono font-semibold">{maxTokens} رمز</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="2000"
                                            step="50"
                                            value={maxTokens}
                                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                            className="w-full accent-emerald-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button type="submit" disabled={saving} className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin me-2" />
                                        جارٍ حفظ الإعدادات...
                                    </>
                                ) : (
                                    'حفظ بيانات المنشأة وتفعيل التعديلات'
                                )}
                            </Button>
                        </form>

                        {/* Interactive Simulator (5 Columns) */}
                        <div className="lg:col-span-5 flex flex-col h-[720px] rounded-2xl border border-border/80 bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden shadow-lg sticky top-6">
                            {/* Simulator Header */}
                            <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                        🤖
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">محاكي الرد الذكي المباشر</h4>
                                        <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                            {selectedModel} • {tones.find((t) => t.id === selectedTone)?.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setChatHistory([
                                            {
                                                role: 'model',
                                                text: `مرحباً بك مجدداً في (${companyName || 'منشأتك'})! يمكنك اختبار أي سؤال متعلق بمنتجاتك أو ساعات عملك.`,
                                                time: 'الآن',
                                            },
                                        ])
                                    }
                                    title="مسح المحادثة"
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Simulator Chat Stream */}
                            <div
                                className="flex-1 p-4 overflow-y-auto space-y-3"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)',
                                    backgroundSize: '16px 16px',
                                }}
                            >
                                {chatHistory.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-te-none'
                                                    : 'bg-white dark:bg-[#202c33] text-foreground rounded-ts-none'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            <span className="block text-[10px] text-muted-foreground mt-1 text-end">
                                                {msg.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {simulating && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-ts-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-muted-foreground">
                                            <Sparkles className="h-4 w-4 animate-spin text-emerald-500" />
                                            <span>جيميني يصيغ الرد بناءً على تعريف شركتك...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Simulator Input Form */}
                            <form
                                onSubmit={handleTestSend}
                                className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex items-center gap-2 border-t border-border/40"
                            >
                                <Input
                                    type="text"
                                    placeholder="اكتب استفساراً (مثلاً: ما هي أسعاركم؟ أو متى التوصيل؟)..."
                                    value={testInput}
                                    onChange={(e) => setTestInput(e.target.value)}
                                    disabled={simulating}
                                    className="bg-white dark:bg-[#2a3942] border-0 h-10 shadow-none text-sm"
                                />
                                <Button
                                    type="submit"
                                    disabled={simulating || !testInput.trim()}
                                    className="h-10 px-4 bg-[#008069] hover:bg-[#006e59] text-white shrink-0"
                                >
                                    <Send className="h-4 w-4 -scale-x-100" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
