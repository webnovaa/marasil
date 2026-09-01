import AdminShell from '@/Layouts/AdminShell';

type Row = { id: string; subject: string; status: string; priority: string };

export default function AdminSupportIndex({ tickets }: { tickets: Row[] }) {
    return (
        <AdminShell title="تذاكر الدعم" description="قائمة التذاكر المفتوحة من العملاء.">
            {tickets.length === 0 ? (
                <p className="text-body-sm text-[rgb(var(--muted))]">لا تذاكر حالياً.</p>
            ) : (
                <ul className="divide-y divide-[rgb(var(--border))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    {tickets.map((ticket) => (
                        <li key={ticket.id} className="flex items-center justify-between px-4 py-3">
                            <p className="font-semibold">{ticket.subject}</p>
                            <span className="text-caption">
                                {ticket.status} · {ticket.priority}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </AdminShell>
    );
}
