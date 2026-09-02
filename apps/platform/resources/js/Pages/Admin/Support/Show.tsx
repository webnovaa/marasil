import { FormEvent, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AdminShell from '@/Layouts/AdminShell';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { adminPatch, adminPost } from '@/Lib/api-client';
import { useI18n } from '@/i18n';

type Message = {
    id: number;
    body: string;
    is_staff: boolean;
    created_at: string | null;
    author?: { full_name: string | null; phone_e164: string } | null;
};

type Ticket = {
    id: string;
    subject: string;
    status: string;
    priority: string;
    tenant?: { name: string } | null;
    user?: { full_name: string | null; phone_e164: string } | null;
    messages?: Message[] | null;
};

export default function AdminSupportShow({ ticket: initial }: { ticket: Ticket }) {
    const { t } = useI18n();
    const [ticket, setTicket] = useState(initial);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendReply = async (e: FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setBusy(true);
        setError(null);
        try {
            const res = await adminPost<{ ticket: Ticket }>(`/support-tickets/${ticket.id}/reply`, { body: reply.trim() });
            if (res.success && res.data?.ticket) {
                setTicket(res.data.ticket);
                setReply('');
            }
        } catch {
            setError(t('admin.support.errors.send'));
        } finally {
            setBusy(false);
        }
    };

    const updateMeta = async (field: 'status' | 'priority', value: string) => {
        setBusy(true);
        try {
            const res = await adminPatch<{ ticket: Ticket }>(`/support-tickets/${ticket.id}`, { [field]: value });
            if (res.success && res.data?.ticket) setTicket(res.data.ticket);
        } catch {
            setError(t('admin.support.errors.update'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminShell title={ticket.subject} description={t('admin.support.showDescription')}>
            <div className="mb-4">
                <Link href="/admin/support" className="inline-flex items-center gap-1 text-sm text-[rgb(var(--brand-700))] hover:underline">
                    <ArrowRight className="size-4" /> {t('admin.support.backToList')}
                </Link>
            </div>

            <div className="admin-panel mb-4 grid gap-4 p-4 sm:grid-cols-3">
                <div>
                    <p className="text-caption text-[rgb(var(--muted))]">{t('common.account')}</p>
                    <p className="font-semibold">{ticket.tenant?.name ?? t('common.emDash')}</p>
                </div>
                <div>
                    <p className="text-caption text-[rgb(var(--muted))]">{t('admin.support.customer')}</p>
                    <p className="font-semibold">{ticket.user?.full_name ?? ticket.user?.phone_e164}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="min-w-[120px]">
                        <p className="mb-1 text-caption">{t('common.status')}</p>
                        <Select value={ticket.status} onValueChange={(v) => void updateMeta('status', v)} disabled={busy}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['open', 'in_progress', 'waiting_customer', 'closed'].map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="min-w-[120px]">
                        <p className="mb-1 text-caption">{t('common.priority')}</p>
                        <Select value={ticket.priority} onValueChange={(v) => void updateMeta('priority', v)} disabled={busy}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['low', 'normal', 'high', 'urgent'].map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

            <div className="admin-panel space-y-4 p-4">
                {(ticket.messages ?? []).map((msg) => (
                    <div
                        key={msg.id}
                        className={`rounded-[var(--radius-md)] border p-4 ${msg.is_staff ? 'border-[rgb(var(--brand-200))] bg-[rgb(var(--brand-50))]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))]'}`}
                    >
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{msg.is_staff ? t('admin.support.supportTeam') : (msg.author?.full_name ?? t('admin.support.customer'))}</p>
                            {msg.is_staff && <Badge tone="brand">staff</Badge>}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7">{msg.body}</p>
                    </div>
                ))}

                {ticket.status !== 'closed' && (
                    <form onSubmit={sendReply} className="space-y-3 border-t border-[rgb(var(--border))] pt-4">
                        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder={t('admin.support.replyPlaceholder')} required />
                        <Button type="submit" disabled={busy}>{t('admin.support.sendReply')}</Button>
                    </form>
                )}
            </div>
        </AdminShell>
    );
}
