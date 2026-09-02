import { FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Member = { id: number; role: string; status: string; name: string | null; phone_e164: string | null };
type Invite = { id: string; phone_e164: string; role: string; expires_at: string | null };

export default function TeamIndex({ members, invites }: { members: Member[]; invites: Invite[] }) {
    const { t } = useI18n();
    const form = useForm({ phone_e164: '', role: 'tenant_member' });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/team/invites');
    }

    return (
        <TenantShell title={t('tenant.team.title')} description={t('tenant.team.description')}>
            <TenantPanel title={t('tenant.team.invite')}>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                        <Label htmlFor="phone_e164">{t('common.phone')}</Label>
                        <Input id="phone_e164" dir="ltr" value={form.data.phone_e164} onChange={(e) => form.setData('phone_e164', e.target.value)} placeholder="+9639..." required />
                    </div>
                    <div>
                        <Label>{t('common.role')}</Label>
                        <Select value={form.data.role} onValueChange={(v) => form.setData('role', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tenant_member">{t('tenant.team.roles.tenant_member')}</SelectItem>
                                <SelectItem value="tenant_owner">{t('tenant.team.roles.tenant_owner')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={form.processing}>{t('tenant.team.sendInvite')}</Button>
                </form>
            </TenantPanel>

            <TenantPanel title={t('tenant.team.members')} flush>
                {members.length === 0 ? (
                    <TenantEmptyState icon={Users} title={t('tenant.team.emptyTitle')} description={t('tenant.team.emptyDescription')} />
                ) : (
                    <ul className="tenant-list">
                        {members.map((member) => (
                            <li key={member.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{member.name ?? member.phone_e164}</p>
                                    <p className="tenant-list__secondary">{member.role} · {member.status}</p>
                                </div>
                                {member.status === 'active' && member.role !== 'tenant_owner' && (
                                    <Button size="sm" variant="outline" onClick={() => router.delete(`/team/members/${member.id}`)}>{t('common.remove')}</Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>

            {invites.length > 0 && (
                <TenantPanel title={t('tenant.team.pendingInvites')} flush>
                    <ul className="tenant-list">
                        {invites.map((invite) => (
                            <li key={invite.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary" dir="ltr">{invite.phone_e164}</p>
                                    <p className="tenant-list__secondary">{invite.role}</p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => router.delete(`/team/invites/${invite.id}`)}>{t('common.cancel')}</Button>
                            </li>
                        ))}
                    </ul>
                </TenantPanel>
            )}
        </TenantShell>
    );
}
