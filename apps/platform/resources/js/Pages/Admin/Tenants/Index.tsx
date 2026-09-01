import AdminShell from '@/Layouts/AdminShell';

type Row = { id: string; name: string; slug: string; status: string };

export default function AdminTenantsIndex({ tenants }: { tenants: Row[] }) {
    return (
        <AdminShell title="الحسابات" description="المستأجرون المسجّلون على المنصة.">
            <ul className="divide-y divide-[rgb(var(--border))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                {tenants.map((tenant) => (
                    <li key={tenant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <p className="font-semibold">{tenant.name}</p>
                            <p className="text-caption text-[rgb(var(--muted))]">{tenant.slug}</p>
                        </div>
                        <span className="text-caption">{tenant.status}</span>
                    </li>
                ))}
            </ul>
        </AdminShell>
    );
}
