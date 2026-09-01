import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { LifeBuoy } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Textarea } from '@/Components/ui/Textarea';
import TenantShell from '@/Layouts/TenantShell';

type Ticket = {
    id: string;
    subject: string;
    status: string;
    priority: string;
    created_at: string | null;
};

type Props = {
    tickets: Ticket[];
};

export default function SupportIndex({ tickets }: Props) {
    const form = useForm({
        subject: '',
        body: '',
        priority: 'normal',
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/support');
    }

    return (
        <TenantShell title="الدعم" description="تذاكر داخل المنصة. لا تُرسل أسرار أو محتوى رسائل كامل.">
            <TenantPanel title="تذكرة جديدة">
                <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                        <Label htmlFor="subject">الموضوع</Label>
                        <Input id="subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="body">الوصف</Label>
                        <Textarea id="body" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        فتح تذكرة
                    </Button>
                </form>
            </TenantPanel>

            <TenantPanel title="التذاكر" flush>
                {tickets.length === 0 ? (
                    <TenantEmptyState icon={LifeBuoy} title="لا تذاكر" description="افتح تذكرة عند الحاجة لمساعدة تشغيلية." />
                ) : (
                    <ul className="tenant-list">
                        {tickets.map((ticket) => (
                            <li key={ticket.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{ticket.subject}</p>
                                    <p className="tenant-list__secondary">{ticket.priority}</p>
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
