import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Textarea } from '@/Components/ui/Textarea';
import TenantShell from '@/Layouts/TenantShell';

type Template = {
    id: string;
    name: string;
    slug: string;
    category: string;
    body: string | null;
    version: number | null;
};

type Props = {
    templates: Template[];
};

export default function TemplatesIndex({ templates }: Props) {
    const form = useForm({
        name: '',
        category: 'transactional',
        body: 'مرحبا {{name}}',
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/templates');
    }

    return (
        <TenantShell title="القوالب" description="كل نسخة غير قابلة للتعديل. المتغيرات بين {{ }} فقط — بلا eval.">
            <TenantPanel title="قالب جديد">
                <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                        <Label htmlFor="name">الاسم</Label>
                        <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="body">النص</Label>
                        <Textarea id="body" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        حفظ نسخة
                    </Button>
                </form>
            </TenantPanel>

            <TenantPanel title="القوالب" flush>
                {templates.length === 0 ? (
                    <TenantEmptyState icon={FileText} title="لا قوالب" description="أنشئ قالباً للرسائل المتكررة." />
                ) : (
                    <ul className="tenant-list">
                        {templates.map((template) => (
                            <li key={template.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{template.name}</p>
                                    <p className="tenant-list__secondary">
                                        {template.category} · v{template.version ?? 0}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>
        </TenantShell>
    );
}
