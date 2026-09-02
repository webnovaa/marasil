import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { LifeBuoy } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Ticket = { id: string; subject: string; status: string; priority: string; created_at: string | null };

export default function SupportIndex({ tickets }: { tickets: Ticket[] }) {
    const { t, formatDate } = useI18n();
    const form = useForm({ subject: '', body: '', priority: 'normal' });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/support');
    }

    return (
        <TenantShell title={t('tenant.support.title')} description={t('tenant.support.description')}>
            <TenantPanel title={t('tenant.support.newTicket')}>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div><Label htmlFor="subject">{t('common.subject')}</Label><Input id="subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} required /></div>
                    <div><Label htmlFor="body">{t('common.body')}</Label><Textarea id="body" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} required /></div>
                    <div>
                        <Label>{t('common.priority')}</Label>
                        <Select value={form.data.priority} onValueChange={(v) => form.setData('priority', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['low', 'normal', 'high'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={form.processing}>{t('tenant.support.openTicket')}</Button>
                </form>
            </TenantPanel>

            <TenantPanel title={t('tenant.support.tickets')} flush>
                {tickets.length === 0 ? (
                    <TenantEmptyState icon={LifeBuoy} title={t('tenant.support.emptyTitle')} description={t('tenant.support.emptyDescription')} />
                ) : (
                    <ul className="tenant-list">
                        {tickets.map((ticket) => (
                            <li key={ticket.id} className="tenant-list__item">
                                <div>
                                    <Link href={`/support/${ticket.id}`} className="tenant-list__primary hover:underline">{ticket.subject}</Link>
                                    <p className="tenant-list__secondary">{ticket.priority} · {formatDate(ticket.created_at, { dateStyle: 'medium' })}</p>
                                </div>
                                <Badge>{ticket.status}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
