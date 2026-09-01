import AdminShell from '@/Layouts/AdminShell';

type Row = { id: string; full_name: string | null; phone_e164: string | null; status: string };

export default function AdminUsersIndex({ users }: { users: Row[] }) {
    return (
        <AdminShell title="المستخدمون" description="قائمة حقيقية من قاعدة البيانات.">
            <ul className="divide-y divide-[rgb(var(--border))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                            <p className="font-semibold">{user.full_name ?? '—'}</p>
                            <p className="text-caption text-[rgb(var(--muted))]" dir="ltr">
                                {user.phone_e164}
                            </p>
                        </div>
                        <span className="text-caption">{user.status}</span>
                    </li>
                ))}
            </ul>
        </AdminShell>
    );
}
