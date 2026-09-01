import { Head } from '@inertiajs/react';
import MarketingLayout from '@/Components/patterns/MarketingLayout';
import { Badge } from '@/Components/ui/Badge';

type StatusProps = {
    services: Array<{ name: string; status: 'operational' | 'degraded' | 'down' }>;
    disclaimer?: string | null;
};

export default function StatusPage({ services, disclaimer }: StatusProps) {
    return (
        <MarketingLayout>
            <Head title="حالة الخدمة" />
            <section className="mx-auto max-w-[var(--content-max-forms)] px-4 py-14 md:px-8">
                <h1 className="text-h1 text-[rgb(var(--brand-950))]">حالة الخدمة</h1>
                <p className="mt-2 text-body text-[rgb(var(--muted))]">
                    حالة المكوّنات المعروفة حالياً. لا نعرض «يعمل» لمحرك غير مفعّل.
                </p>
                {disclaimer ? (
                    <p className="mt-4 rounded-[var(--radius-md)] border border-[rgb(var(--warning-border))] bg-[rgb(var(--warning-bg))] px-4 py-3 text-body-sm text-[rgb(var(--warning))]">
                        {disclaimer}
                    </p>
                ) : null}
                <ul className="mt-8 space-y-3">
                    {services.map((service) => (
                        <li
                            key={service.name}
                            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3"
                        >
                            <span className="text-body font-medium">{service.name}</span>
                            <Badge
                                tone={
                                    service.status === 'operational'
                                        ? 'success'
                                        : service.status === 'degraded'
                                          ? 'warning'
                                          : 'danger'
                                }
                            >
                                {service.status === 'operational'
                                    ? 'يعمل'
                                    : service.status === 'degraded'
                                      ? 'متأثر'
                                      : 'متوقف'}
                            </Badge>
                        </li>
                    ))}
                </ul>
            </section>
        </MarketingLayout>
    );
}
