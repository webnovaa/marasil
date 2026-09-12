import { Link } from '@inertiajs/react';
import { 
    Megaphone, 
    Plus, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Play, 
    Pause,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantPagination } from '@/Components/patterns/tenant/TenantPagination';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Campaign = {
    id: number;
    ulid: string;
    name: string;
    status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    min_delay_seconds: number;
    max_delay_seconds: number;
    created_at: string;
};

type Props = {
    campaigns: Campaign[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number } | null;
};

export default function CampaignsIndex({ campaigns, pagination }: Props) {
    const { formatDate } = useI18n();

    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
    const totalRecipients = campaigns.reduce((acc, c) => acc + c.total_recipients, 0);
    const successRate = totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 100;

    function statusBadge(status: string) {
        switch (status) {
            case 'running':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 animate-pulse">
                        <Play className="h-3 w-3" /> قيد الإرسال
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400">
                        <CheckCircle2 className="h-3 w-3" /> مكتملة
                    </span>
                );
            case 'paused':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        <Pause className="h-3 w-3" /> متوقفة مؤقتاً
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                        <AlertCircle className="h-3 w-3" /> فشلت
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Clock className="h-3 w-3" /> مسودة
                    </span>
                );
        }
    }

    return (
        <TenantShell
            title="حملات الإرسال الجماعي الذكية"
            description="أطلق حملات إعلانية وتنبيهات لآلاف الأرقام بأمان تام مع التبديل التناوبي بين أجهزتك وفواصل زمنية ذكية لمنع الحظر"
            headerActions={
                <Link href="/campaigns/create">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                        <Plus className="h-4 w-4" />
                        إنشاء حملة جديدة
                    </Button>
                </Link>
            }
        >
            {/* KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
                    <div className="flex items-center justify-between text-[rgb(var(--muted))] mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">إجمالي الحملات</span>
                        <Megaphone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{pagination?.total ?? campaigns.length}</p>
                </div>

                <div className="p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
                    <div className="flex items-center justify-between text-[rgb(var(--muted))] mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">الرسائل المسلّمة</span>
                        <CheckCircle2 className="h-5 w-5 text-sky-600" />
                    </div>
                    <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{totalSent.toLocaleString()}</p>
                </div>

                <div className="p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
                    <div className="flex items-center justify-between text-[rgb(var(--muted))] mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">نسبة النجاح الكلية</span>
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{successRate}%</p>
                </div>
            </div>

            {/* Campaigns List */}
            <TenantPanel title={`سجل الحملات (${pagination?.total ?? campaigns.length})`} flush>
                {campaigns.length === 0 ? (
                    <TenantEmptyState
                        icon={Megaphone}
                        title="لا توجد حملات تسويقية حتى الآن"
                        description="أنشئ أول حملة تسويقية واختر جمهورك المستهدف لإرسال رسائل مخصصة مع حماية الحظر."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-[rgb(var(--muted))]/5 border-b border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--muted))] uppercase">
                                <tr>
                                    <th className="px-4 py-3">اسم الحملة</th>
                                    <th className="px-4 py-3">الحالة</th>
                                    <th className="px-4 py-3">التقدم</th>
                                    <th className="px-4 py-3">الفواصل الزمنية</th>
                                    <th className="px-4 py-3">تاريخ الإنشاء</th>
                                    <th className="px-4 py-3 text-end">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgb(var(--border))]">
                                {campaigns.map((c) => {
                                    const pct = c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
                                    return (
                                        <tr key={c.id} className="hover:bg-[rgb(var(--muted))]/5 transition-colors">
                                            <td className="px-4 py-4 font-bold text-[rgb(var(--foreground))]">
                                                <Link href={`/campaigns/${c.ulid}`} className="hover:underline flex items-center gap-1.5">
                                                    {c.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">{statusBadge(c.status)}</td>
                                            <td className="px-4 py-4 min-w-[160px]">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-mono text-[rgb(var(--muted))]">
                                                        <span>{c.sent_count} / {c.total_recipients}</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-mono text-[rgb(var(--muted))]">
                                                {c.min_delay_seconds}s - {c.max_delay_seconds}s
                                            </td>
                                            <td className="px-4 py-4 text-xs text-[rgb(var(--muted))]">
                                                {formatDate(c.created_at)}
                                            </td>
                                            <td className="px-4 py-4 text-end">
                                                <Link
                                                    href={`/campaigns/${c.ulid}`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                                >
                                                    متابعة
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="p-4">
                    <TenantPagination pagination={pagination} />
                </div>
            </TenantPanel>
        </TenantShell>
    );
}
