import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, Clock } from 'lucide-react';
import type { SharedSubscription } from '@/Lib/auth';
import { cn } from '@/Lib/cn';

type PageProps = {
    subscription?: SharedSubscription | null;
    flash?: { error?: string | null; success?: string | null };
};

function TenantAlert({
    tone,
    icon: Icon,
    children,
    action,
    stack,
}: {
    tone: 'info' | 'warning' | 'danger';
    icon: typeof AlertCircle;
    children: React.ReactNode;
    action?: React.ReactNode;
    stack?: boolean;
}) {
    return (
        <div className={cn('tenant-alert', `tenant-alert--${tone}`, stack && 'tenant-alert--stack')} role="alert">
            <div className="tenant-alert__content">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>{children}</div>
            </div>
            {action}
        </div>
    );
}

export function SubscriptionGateBanner() {
    const page = usePage<PageProps>().props;
    const pathname = usePage().url.split('?')[0] ?? '/';
    const subscription = page.subscription;
    const flashError = page.flash?.error;
    const flashSuccess = page.flash?.success;

    if (flashSuccess) {
        return (
            <TenantAlert tone="info" icon={AlertCircle}>
                {flashSuccess}
            </TenantAlert>
        );
    }

    if (subscription?.is_usable) {
        return flashError ? (
            <TenantAlert tone="danger" icon={AlertCircle}>
                {flashError}
            </TenantAlert>
        ) : null;
    }

    if (subscription?.has_pending_request) {
        if (pathname === '/subscription') {
            return flashError ? (
                <TenantAlert tone="danger" icon={AlertCircle}>
                    {flashError}
                </TenantAlert>
            ) : null;
        }

        return (
            <TenantAlert
                tone="warning"
                icon={Clock}
                action={
                    <Link href="/subscription" className="tenant-alert__link">
                        متابعة الطلب
                    </Link>
                }
            >
                طلب اشتراكك قيد المراجعة. يمكنك متابعة الحالة من صفحة الاشتراك.
            </TenantAlert>
        );
    }

    if (pathname === '/plans') {
        return (
            <TenantAlert tone="info" icon={AlertCircle} stack>
                {flashError ??
                    'لا يوجد اشتراك فعّال على حسابك. اختر خطة أدناه وأرسل طلب اشتراك للمتابعة.'}
            </TenantAlert>
        );
    }

    if (pathname === '/subscription') {
        return flashError ? (
            <TenantAlert tone="danger" icon={AlertCircle}>
                {flashError}
            </TenantAlert>
        ) : null;
    }

    return (
        <TenantAlert
            tone="info"
            icon={AlertCircle}
            action={
                <Link href="/plans" className="tenant-alert__link">
                    اختيار خطة
                </Link>
            }
        >
            {flashError ?? 'لا يوجد اشتراك فعّال. اختر خطة اشتراك للوصول إلى الأجهزة وواجهة API.'}
        </TenantAlert>
    );
}
