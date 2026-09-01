import AdminShell from '@/Layouts/AdminShell';

type Row = { id: string; action: string; subject_type: string | null; created_at: string | null };

export default function AdminAuditIndex({ logs }: { logs: Row[] }) {
    return (
        <AdminShell title="سجل التدقيق" description="أحداث موثّقة بدون أسرار أو محتوى رسائل.">
            {logs.length === 0 ? (
                <p className="text-body-sm text-[rgb(var(--muted))]">لا سجلات بعد.</p>
            ) : (
                <ul className="divide-y divide-[rgb(var(--border))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    {logs.map((log) => (
                        <li key={log.id} className="px-4 py-3">
                            <p className="font-semibold">{log.action}</p>
                            <p className="text-caption text-[rgb(var(--muted))]">
                                {log.subject_type} · {log.created_at}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </AdminShell>
    );
}
