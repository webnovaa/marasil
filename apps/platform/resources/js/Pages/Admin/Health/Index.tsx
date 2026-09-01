import AdminShell from '@/Layouts/AdminShell';

type Health = {
    otp_channel: string;
    whatsapp_engine: string;
    queue: string;
    cache: string;
};

export default function AdminHealthIndex({ health }: { health: Health }) {
    return (
        <AdminShell title="صحة النظام" description="قيم الإعداد الحالية — ليست لوحة مراقبة خارجية.">
            <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(health).map(([key, value]) => (
                    <div key={key} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                        <dt className="text-caption text-[rgb(var(--muted))]">{key}</dt>
                        <dd className="mt-1 font-mono text-sm" dir="ltr">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </AdminShell>
    );
}
