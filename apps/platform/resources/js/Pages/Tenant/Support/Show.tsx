import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Textarea } from '@/Components/ui/Textarea';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Message = { id: number; body: string; is_staff: boolean; created_at: string | null; author?: { full_name: string | null } | null };
type Ticket = { id: string; subject: string; status: string; priority: string; messages?: Message[] | null };

export default function SupportShow({ ticket: initial }: { ticket: Ticket }) {
    const { t, formatDate } = useI18n();
    const [ticket] = useState(initial);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);

    const sendReply = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.post(`/support/${ticket.id}/reply`, { body: reply }, {
            onFinish: () => { setBusy(false); setReply(''); },
        });
    };

    return (
        <TenantShell title={ticket.subject} description={t('tenant.support.showDescription')}>
            <Link href="/support" className="mb-4 inline-flex items-center gap-1 text-sm text-[rgb(var(--brand-700))] hover:underline">
                <ArrowRight className="size-4" /> {t('common.back')}
            </Link>

            <div className="mb-4 flex flex-wrap gap-2">
                <Badge>{ticket.status}</Badge>
                <Badge tone="neutral">{ticket.priority}</Badge>
                {ticket.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => router.post(`/support/${ticket.id}/close`)}>{t('tenant.support.closeTicket')}</Button>
                )}
            </div>

            <TenantPanel title={t('tenant.support.conversation')}>
                <div className="space-y-4">
                    {(ticket.messages ?? []).map((msg) => (
                        <div key={msg.id} className={`rounded-lg border p-4 ${msg.is_staff ? 'border-[rgb(var(--brand-200))] bg-[rgb(var(--brand-50))]' : 'border-[rgb(var(--border))]'}`}>
                            <p className="mb-2 text-sm font-semibold">{msg.is_staff ? t('tenant.support.supportTeam') : (msg.author?.full_name ?? t('tenant.support.you'))}</p>
                            <p className="whitespace-pre-wrap text-sm leading-7">{msg.body}</p>
                            {msg.created_at && <p className="mt-2 text-caption">{formatDate(msg.created_at)}</p>}
                        </div>
                    ))}
                </div>

                {ticket.status !== 'closed' && (
                    <form onSubmit={sendReply} className="mt-4 space-y-3 border-t pt-4">
                        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder={t('tenant.support.replyPlaceholder')} required />
                        <Button type="submit" disabled={busy}>{t('common.send')}</Button>
                    </form>
                )}
                {ticket.status === 'closed' && <Alert tone="neutral" className="mt-4">{t('tenant.support.ticketClosed')}</Alert>}
            </TenantPanel>
        </TenantShell>
    );
}
