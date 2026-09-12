import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCheck,
    Check,
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Smartphone,
    Layers,
    Calendar,
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import TenantShell from '@/Layouts/TenantShell';

type MetricData = {
    total_outbound: number;
    total_inbound: number;
    delivery_rate: number;
    read_rate: number;
    fail_rate: number;
    delivered: number;
    read: number;
    failed: number;
    peak_hour: string;
};

type HeatmapHour = {
    hour: string;
    outbound: number;
    inbound: number;
    total: number;
};

type DeviceMetric = {
    name: string;
    phone: string | null;
    status: string;
    messages_count: number;
};

type Props = {
    metrics: MetricData;
    heatmap: HeatmapHour[];
    devices: DeviceMetric[];
    categories: Record<string, number>;
};

export default function AnalyticsIndex({ metrics, heatmap, devices, categories }: Props) {
    const maxHourTotal = Math.max(...heatmap.map((h) => h.total), 1);

    const categoryLabels: Record<string, string> = {
        transactional: 'رسائل المعاملات والطلبات',
        marketing: 'حملات تسويقية',
        otp: 'رموز التحقق OTP',
        customer_support: 'خدمة العملاء والردود',
    };

    const totalCategorized = Object.values(categories).reduce((acc, v) => acc + v, 0);

    return (
        <TenantShell title="التحليلات المتقدمة">
            <div className="space-y-6">
                <TenantPanel
                    title="التحليلات المتقدمة وخريطة النشاط الساعي"
                    description="رؤى تفصيلية حول أداء رسائل الواتساب، معدلات التسليم والقراءة، وساعات الذروة لتحسين توقيت إرسال حملاتك."
                >
                    {/* Primary Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Delivery Rate */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">معدل التسليم الناجح</span>
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <CheckCheck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-foreground">{metrics.delivery_rate}%</span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">ممتاز</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(metrics.delivery_rate, 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">{metrics.delivered} رسالة تم تسليمها بنجاح</p>
                        </div>

                        {/* Read Rate */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">معدل فتح وقراءة الرسائل</span>
                                <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-foreground">{metrics.read_rate}%</span>
                                <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">تفاعل عالٍ</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(metrics.read_rate, 100)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">{metrics.read} رسالة تم فتحها وقراءتها</p>
                        </div>

                        {/* Volume Balance */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">إجمالي الرسائل</span>
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                                    <Layers className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-foreground">
                                    {metrics.total_outbound + metrics.total_inbound}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <ArrowUpRight className="h-3 w-3" />
                                    صادرة: {metrics.total_outbound}
                                </span>
                                <span className="flex items-center gap-1 text-sky-600">
                                    <ArrowDownLeft className="h-3 w-3" />
                                    واردة: {metrics.total_inbound}
                                </span>
                            </div>
                        </div>

                        {/* Peak Hour */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">ساعة الذروة الأكثر تفاعلاً</span>
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-foreground" dir="ltr">
                                    {metrics.peak_hour}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground pt-2">
                                التوقيت الأفضل لإرسال الحملات والعروض الترويجية
                            </p>
                        </div>
                    </div>

                    {/* 24-Hour Activity Heatmap */}
                    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                                    خريطة النشاط على مدار الـ 24 ساعة (Heatmap)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    توزيع حركة الرسائل الواردة والصادرة على مدار ساعات اليوم لتحديد أوقات تواجد عملائك
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                                    رسائل صادرة
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                                    رسائل واردة
                                </span>
                            </div>
                        </div>

                        {/* Visual Bars */}
                        <div className="h-48 flex items-end gap-1 sm:gap-2 pt-6 pb-2">
                            {heatmap.map((h, idx) => {
                                const outboundPct = (h.outbound / maxHourTotal) * 100;
                                const inboundPct = (h.inbound / maxHourTotal) * 100;
                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                                    >
                                        {/* Hover Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                            <div className="bg-popover text-popover-foreground text-[10px] rounded-lg px-2 py-1 shadow-lg border border-border whitespace-nowrap">
                                                <div className="font-bold">{h.hour}</div>
                                                <div className="text-emerald-600">صادرة: {h.outbound}</div>
                                                <div className="text-sky-600">واردة: {h.inbound}</div>
                                                <div className="text-foreground font-semibold">المجموع: {h.total}</div>
                                            </div>
                                        </div>

                                        {/* Stacked Bar */}
                                        <div className="w-full max-w-[20px] flex flex-col justify-end bg-muted/40 rounded-t-md overflow-hidden h-full">
                                            <div
                                                className="w-full bg-sky-500/90 transition-all duration-300"
                                                style={{ height: `${inboundPct}%` }}
                                            />
                                            <div
                                                className="w-full bg-emerald-500 transition-all duration-300"
                                                style={{ height: `${outboundPct}%` }}
                                            />
                                        </div>

                                        {/* Hour label */}
                                        {idx % 2 === 0 && (
                                            <span className="text-[9px] text-muted-foreground/80 font-mono -rotate-45 sm:rotate-0 mt-1">
                                                {h.hour.split(':')[0]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Secondary Grid: Devices & Categories */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Device Performance */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-emerald-500" />
                                أداء أجهزة الواتساب المربوطة
                            </h3>

                            {devices.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-4 text-center">لا توجد أجهزة متصلة بعد</p>
                            ) : (
                                <div className="space-y-3">
                                    {devices.map((d, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-xs text-foreground">{d.name}</div>
                                                <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                                                    {d.phone || '—'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-foreground">
                                                    {d.messages_count} رسالة
                                                </span>
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        d.status === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Categories Breakdown */}
                        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4 text-emerald-500" />
                                تصنيف حركة الرسائل (Categories)
                            </h3>

                            {Object.keys(categories).length === 0 ? (
                                <p className="text-xs text-muted-foreground p-4 text-center">لا توجد تصنيفات مسجلة بعد</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(categories).map(([cat, count]) => {
                                        const pct =
                                            totalCategorized > 0
                                                ? Math.round((count / totalCategorized) * 100)
                                                : 0;
                                        return (
                                            <div key={cat} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium text-foreground">
                                                        {categoryLabels[cat] || cat}
                                                    </span>
                                                    <span className="text-muted-foreground font-mono">
                                                        {count} ({pct}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
