import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminShell from '@/Layouts/AdminShell';
import { adminPost } from '@/Lib/api-client';

type PendingUser = {
    id: string;
    full_name: string | null;
    phone_e164: string;
    company_name: string | null;
    created_at: string | null;
};

type Props = {
    users: PendingUser[];
};

export default function Pending({ users: initial }: Props) {
    const [users, setUsers] = useState(initial);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function approve(id: string) {
        setBusy(id);
        setError(null);
        try {
            await adminPost(`/users/${id}/approve`, {});
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch {
            setError('تعذر قبول الحساب.');
        } finally {
            setBusy(null);
        }
    }

    async function reject(id: string) {
        const reason = window.prompt('سبب الرفض');
        if (!reason) return;
        setBusy(id);
        setError(null);
        try {
            await adminPost(`/users/${id}/reject`, { reason });
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch {
            setError('تعذر رفض الحساب.');
        } finally {
            setBusy(null);
        }
    }

    return (
        <AdminShell title="طلبات الحسابات" description="مراجعة الحسابات الجديدة بانتظار الموافقة.">
            <div className="admin-panel p-4 sm:p-5 lg:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-body-sm text-[rgb(var(--muted))] sm:text-body">قائمة المستخدمين المعلّقين</p>
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 text-sm font-semibold text-[rgb(var(--brand-700))] transition-colors hover:bg-[rgb(var(--brand-50))]"
                    >
                        تحديث
                    </button>
                </div>
                {error && <p className="mb-4 text-sm text-[rgb(var(--danger))]">{error}</p>}
                {users.length === 0 ? (
                    <p className="text-[rgb(var(--muted))]">لا توجد طلبات معلّقة.</p>
                ) : (
                    <ul className="space-y-3">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[rgb(var(--border-soft))] bg-[rgb(var(--surface-soft))] p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5"
                            >
                                <div>
                                    <p className="font-bold">{user.full_name ?? '—'}</p>
                                    <p className="text-sm text-[rgb(var(--muted))]" dir="ltr">
                                        {user.phone_e164}
                                    </p>
                                    <p className="text-sm text-[rgb(var(--muted))]">{user.company_name}</p>
                                </div>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={busy === user.id}
                                        onClick={() => approve(user.id)}
                                        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--brand-600))] px-4 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                                    >
                                        قبول
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy === user.id}
                                        onClick={() => reject(user.id)}
                                        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--danger-border))] px-4 text-sm font-bold text-[rgb(var(--danger))]"
                                    >
                                        رفض
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminShell>
    );
}
