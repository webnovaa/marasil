import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import TenantShell from '@/Layouts/TenantShell';

type Member = {
    id: number;
    role: string;
    status: string;
    name: string | null;
    phone_e164: string | null;
};

type Invite = {
    id: string;
    phone_e164: string;
    role: string;
    expires_at: string | null;
};

type Props = {
    members: Member[];
    invites: Invite[];
};

export default function TeamIndex({ members, invites }: Props) {
    const form = useForm({
        phone_e164: '',
        role: 'tenant_member',
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/team/invites');
    }

    return (
        <TenantShell title="الفريق" description="الدعوات تصل برقم واتساب. لا بريد في هذا الإصدار.">
            <TenantPanel title="دعوة عضو">
                <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                        <Label htmlFor="phone_e164">رقم الهاتف</Label>
                        <Input
                            id="phone_e164"
                            dir="ltr"
                            value={form.data.phone_e164}
                            onChange={(e) => form.setData('phone_e164', e.target.value)}
                            placeholder="+9639..."
                            required
                        />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        إرسال دعوة
                    </Button>
                </form>
            </TenantPanel>

            <TenantPanel title="الأعضاء" flush>
                {members.length === 0 ? (
                    <TenantEmptyState icon={Users} title="لا أعضاء" description="أنت مالك الحساب حتى تضيف فريقاً." />
                ) : (
                    <ul className="tenant-list">
                        {members.map((member) => (
                            <li key={member.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{member.name ?? member.phone_e164}</p>
                                    <p className="tenant-list__secondary">
                                        {member.role} · {member.status}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>

            {invites.length > 0 ? (
                <TenantPanel title="دعوات معلّقة" flush>
                    <ul className="tenant-list">
                        {invites.map((invite) => (
                            <li key={invite.id} className="tenant-list__item">
                                <p className="tenant-list__primary" dir="ltr">
                                    {invite.phone_e164}
                                </p>
                                <p className="tenant-list__secondary">{invite.role}</p>
                            </li>
                        ))}
                    </ul>
                </TenantPanel>
            ) : null}
        </TenantShell>
    );
}
