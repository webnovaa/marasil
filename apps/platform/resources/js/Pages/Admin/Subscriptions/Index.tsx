import AdminShell from '@/Layouts/AdminShell';

type Row = { id: string; plan_name: string; status: string; ends_at: string | null };

export default function AdminSubscriptionsIndex({ subscriptions }: { subscriptions: Row[] }) {
    return (
        <AdminShell title="الاشتراكات" description="لقطة الحالة الحالية لكل اشتراك.">
            <ul className="divide-y divide-[rgb(var(--border))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                {subscriptions.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <p className="font-semibold">{row.plan_name}</p>
                            <p className="text-caption text-[rgb(var(--muted))]">{row.ends_at ?? '—'}</p>
                        </div>
                        <span className="text-caption">{row.status}</span>
                    </li>
                ))}
            </ul>
        </AdminShell>
    );
}
