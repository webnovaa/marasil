import { Clock, CreditCard } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { LinkButton } from '@/Components/ui/LinkButton';
import TenantShell from '@/Layouts/TenantShell';

type Subscription = {
    id: string;
    status: string;
    is_usable: boolean;
    plan_name: string;
    plan_slug: string;
    starts_at: string | null;
    ends_at: string | null;
    grace_ends_at: string | null;
    max_devices: number;
    monthly_message_limit: number;
} | null;

type RequestItem = {
    id: string;
    type: string;
    status: string;
    created_at: string | null;
    plan: { name: string } | null;
};

type Props = {
    subscription: Subscription;
    requests: RequestItem[];
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('ar', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: 'قيد المراجعة',
        approved: 'مقبول',
        rejected: 'مرفوض',
        active: 'نشط',
        expired: 'منتهٍ',
        suspended: 'موقوف',
        new: 'جديد',
        renewal: 'تجديد',
        upgrade: 'ترقية',
        downgrade: 'تخفيض',
    };

    return labels[status] ?? status;
}

function requestStatusTone(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
    if (status === 'pending') return 'warning';
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'neutral';
}

export default function SubscriptionIndex({ subscription, requests }: Props) {
    const pendingRequest = requests.find((item) => item.status === 'pending');

    return (
        <TenantShell
            title="اشتراكي"
            description="تابع حالة اشتراكك الحالي وطلبات التجديد أو الترقية."
            headerActions={
                subscription?.is_usable ? (
                    <LinkButton href="/plans" variant="secondary" size="sm">
                        ترقية الخطة
                    </LinkButton>
                ) : (
                    <LinkButton href="/plans" size="sm">
                        اختيار خطة
                    </LinkButton>
                )
            }
        >
            {!subscription && !pendingRequest ? (
                <TenantPanel variant="soft">
                    <TenantEmptyState
                        icon={CreditCard}
                        title="لا يوجد اشتراك فعّال"
                        description="اختر خطة اشتراك وأرسل طلباً للمراجعة للبدء باستخدام مراسيل."
                        action={
                            <LinkButton href="/plans" className="mt-2">
                                اختيار خطة
                            </LinkButton>
                        }
                    />
                </TenantPanel>
            ) : null}

            {pendingRequest && !subscription?.is_usable ? (
                <TenantPanel variant="soft" title="طلب قيد المراجعة">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-body-sm text-[rgb(var(--text))]">
                                طلبك للخطة «{pendingRequest.plan?.name ?? '—'}» بانتظار موافقة الإدارة.
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-caption text-[rgb(var(--subtle))]">
                                <Clock className="size-3.5" aria-hidden />
                                {formatDate(pendingRequest.created_at)}
                            </p>
                        </div>
                        <Badge tone="warning">قيد المراجعة</Badge>
                    </div>
                </TenantPanel>
            ) : null}

            {subscription ? (
                <TenantPanel
                    title={subscription.plan_name}
                    description="تفاصيل اشتراكك الحالي وحدود الاستخدام."
                    action={
                        <Badge tone={subscription.is_usable ? 'success' : 'warning'}>
                            {statusLabel(subscription.status)}
                        </Badge>
                    }
                >
                    <dl className="tenant-detail-grid">
                        <div className="tenant-detail-item">
                            <dt>البداية</dt>
                            <dd>{formatDate(subscription.starts_at)}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>النهاية</dt>
                            <dd>{formatDate(subscription.ends_at)}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>انتهاء السماح</dt>
                            <dd>{formatDate(subscription.grace_ends_at)}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>قابل للاستخدام</dt>
                            <dd>{subscription.is_usable ? 'نعم' : 'لا'}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>الأجهزة</dt>
                            <dd>{subscription.max_devices}</dd>
                        </div>
                        <div className="tenant-detail-item">
                            <dt>الرسائل الشهرية</dt>
                            <dd>{subscription.monthly_message_limit.toLocaleString('ar')}</dd>
                        </div>
                    </dl>
                    {!subscription.is_usable ? (
                        <LinkButton href="/plans" variant="secondary" className="mt-5 w-full sm:w-auto">
                            تجديد أو ترقية
                        </LinkButton>
                    ) : null}
                </TenantPanel>
            ) : null}

            <TenantPanel title="سجل طلبات الاشتراك" flush>
                {requests.length === 0 ? (
                    <TenantEmptyState
                        icon={Clock}
                        title="لا توجد طلبات"
                        description="عند إرسال طلب اشتراك سيظهر هنا مع حالته."
                    />
                ) : (
                    <ul className="tenant-list">
                        {requests.map((item) => (
                            <li key={item.id} className="tenant-list__item">
                                <div className="min-w-0">
                                    <p className="tenant-list__primary">{item.plan?.name ?? 'خطة'}</p>
                                    <p className="tenant-list__secondary">
                                        {statusLabel(item.type)} · {formatDate(item.created_at)}
                                    </p>
                                </div>
                                <Badge tone={requestStatusTone(item.status)}>{statusLabel(item.status)}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
