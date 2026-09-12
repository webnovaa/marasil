import { Link, router } from '@inertiajs/react';
import { 
    ArrowRight, 
    Play, 
    Pause, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Smartphone, 
    RefreshCw,
    Users
} from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { TenantPagination } from '@/Components/patterns/tenant/TenantPagination';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Device = {
    id: number;
    display_name: string | null;
    phone_e164: string | null;
};

type Recipient = {
    id: number;
    phone_e164: string;
    recipient_name: string | null;
    status: 'pending' | 'sent' | 'failed';
    error_message: string | null;
    sent_at: string | null;
    device: Device | null;
};

type Campaign = {
    id: number;
    ulid: string;
    name: string;
    status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
    message_template: string;
    min_delay_seconds: number;
    max_delay_seconds: number;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
};

type Props = {
    campaign: Campaign;
    recipients: Recipient[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number } | null;
};

export default function CampaignsShow({ campaign, recipients, pagination }: Props) {
    const { formatDate } = useI18n();

    const pendingCount = Math.max(0, campaign.total_recipients - campaign.sent_count - campaign.failed_count);
    const progressPct = campaign.total_recipients > 0
        ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
        : 0;

    function handlePause() {
        router.post(`/campaigns/${campaign.ulid}/pause`);
    }

    function handleResume() {
        router.post(`/campaigns/${campaign.ulid}/resume`);
    }

    function handleRefresh() {
        router.reload();
    }

    return (
        <TenantShell
            title={campaign.name}
            description={`تفاصيل تقدم الحملة التسويقية والفواصل الزمنية (${campaign.min_delay_seconds}s - ${campaign.max_delay_seconds}s)`}
            headerActions={
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleRefresh} className="gap-1.5">
                        <RefreshCw className="h-4 w-4" />
                        تحديث
                    </Button>
                    {campaign.status === 'running' && (
                        <Button variant="secondary" size="sm" onClick={handlePause} className="gap-1.5 text-amber-600">
                            <Pause className="h-4 w-4" />
                            إيقاف مؤقت
                        </Button>
                    )}
                    {campaign.status === 'paused' && (
                        <Button size="sm" onClick={handleResume} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Play className="h-4 w-4" />
                            استئناف الإرسال
                        </Button>
                    )}
                </div>
            }
        >
            <div className="mb-4">
                <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]">
                    <ArrowRight className="h-4 w-4" />
                    العودة لقائمة الحملات
                </Link>
            </div>

            {/* Progress Bar & KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
                    <span className="text-xs text-[rgb(var(--muted))] font-semibold">إجمالي المستهدفين</span>
                    <p className="text-2xl font-bold mt-1 text-[rgb(var(--foreground))]">{campaign.total_recipients}</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> تم الإرسال
                    </span>
                    <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{campaign.sent_count}</p>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                    <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> فشلت
                    </span>
                    <p className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{campaign.failed_count}</p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> بانتظار الإرسال
                    </span>
                    <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{pendingCount}</p>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6 p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                    <span>نسبة إنجاز الحملة</span>
                    <span className="font-mono text-emerald-600">{progressPct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Message Template Display */}
            <TenantPanel title="قالب الرسالة المعتمد" className="mb-6">
                <div className="p-3.5 rounded-lg bg-[rgb(var(--muted))]/5 border border-[rgb(var(--border))] text-sm whitespace-pre-wrap leading-relaxed text-[rgb(var(--foreground))]">
                    {campaign.message_template}
                </div>
            </TenantPanel>

            {/* Recipients Table */}
            <TenantPanel title={`سجل المستلمين (${pagination?.total ?? recipients.length})`} flush>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-[rgb(var(--muted))]/5 border-b border-[rgb(var(--border))] text-xs font-semibold text-[rgb(var(--muted))] uppercase">
                            <tr>
                                <th className="px-4 py-3">رقم الهاتف</th>
                                <th className="px-4 py-3">الاسم</th>
                                <th className="px-4 py-3">الحالة</th>
                                <th className="px-4 py-3">جهاز الإرسال</th>
                                <th className="px-4 py-3">وقت الإرسال</th>
                                <th className="px-4 py-3">ملاحظات / خطأ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--border))]">
                            {recipients.map((r) => (
                                <tr key={r.id} className="hover:bg-[rgb(var(--muted))]/5">
                                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">{r.phone_e164}</td>
                                    <td className="px-4 py-3 text-xs">{r.recipient_name || '-'}</td>
                                    <td className="px-4 py-3">
                                        {r.status === 'sent' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> تم الإرسال
                                            </span>
                                        )}
                                        {r.status === 'failed' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                                                <AlertCircle className="h-3.5 w-3.5" /> فشل
                                            </span>
                                        )}
                                        {r.status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                                <Clock className="h-3.5 w-3.5" /> بانتظار الدور
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                                        {r.device ? (
                                            <span className="flex items-center gap-1">
                                                <Smartphone className="h-3 w-3" />
                                                {r.device.display_name || r.device.phone_e164}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[rgb(var(--muted))]">
                                        {r.sent_at ? formatDate(r.sent_at) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-rose-500 max-w-xs truncate">
                                        {r.error_message || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4">
                    <TenantPagination pagination={pagination} />
                </div>
            </TenantPanel>
        </TenantShell>
    );
}
