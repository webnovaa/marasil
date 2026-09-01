import { CreditCard, Package, Smartphone, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { StatCard } from '@/Components/patterns/admin/StatCard';

type Stat = {
    title: string;
    value: number;
    description: string;
    tone: 'users' | 'billing' | 'plans' | 'devices';
};

type Props = {
    stats: Stat[];
};

const ICONS: Record<Stat['tone'], LucideIcon> = {
    users: Users,
    billing: CreditCard,
    plans: Package,
    devices: Smartphone,
};

export default function AdminDashboardIndex({ stats }: Props) {
    return (
        <AdminShell
            title="لوحة الإدارة"
            description="نظرة عامة على عمليات المنصة والطلبات المعلّقة."
        >
            <section aria-labelledby="admin-stats-heading">
                <h2 id="admin-stats-heading" className="sr-only">
                    مؤشرات سريعة
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {stats.map((stat) => (
                        <div key={stat.title}>
                            <StatCard
                                title={stat.title}
                                value={stat.value}
                                description={stat.description}
                                icon={ICONS[stat.tone]}
                            />
                        </div>
                    ))}
                </div>
            </section>
        </AdminShell>
    );
}
