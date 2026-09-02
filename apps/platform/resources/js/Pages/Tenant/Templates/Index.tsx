import { FormEvent, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Eye, FileText } from 'lucide-react';
import { TenantEmptyState } from '@/Components/patterns/tenant/TenantEmptyState';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Dialog, DialogContent } from '@/Components/ui/Dialog';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import { Textarea } from '@/Components/ui/Textarea';
import { useI18n } from '@/i18n';
import TenantShell from '@/Layouts/TenantShell';

type Template = {
    id: string;
    name: string;
    slug: string;
    category: string;
    body: string | null;
    version: number | null;
    status?: string;
};

export default function TemplatesIndex({ templates }: { templates: Template[] }) {
    const { t } = useI18n();
    const form = useForm({ name: '', category: 'transactional', body: 'مرحبا {{name}}' });
    const [preview, setPreview] = useState<Template | null>(null);
    const [newVersion, setNewVersion] = useState<Template | null>(null);
    const [versionBody, setVersionBody] = useState('');

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/templates');
    }

    function submitVersion(e: FormEvent) {
        e.preventDefault();
        if (!newVersion) return;
        router.post(`/templates/${newVersion.id}/versions`, { body: versionBody }, {
            onSuccess: () => { setNewVersion(null); setVersionBody(''); },
        });
    }

    return (
        <TenantShell title={t('tenant.templates.title')} description={t('tenant.templates.description')}>
            <TenantPanel title={t('tenant.templates.newTemplate')}>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div><Label htmlFor="name">{t('common.name')}</Label><Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required /></div>
                    <div>
                        <Label>{t('tenant.templates.category')}</Label>
                        <Select value={form.data.category} onValueChange={(v) => form.setData('category', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transactional">{t('tenant.templates.categories.transactional')}</SelectItem>
                                <SelectItem value="otp">{t('tenant.templates.categories.otp')}</SelectItem>
                                <SelectItem value="marketing">{t('tenant.templates.categories.marketing')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div><Label htmlFor="body">{t('tenant.templates.text')}</Label><Textarea id="body" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} required /></div>
                    <Button type="submit" disabled={form.processing}>{t('tenant.templates.saveVersion')}</Button>
                </form>
            </TenantPanel>

            <TenantPanel title={t('tenant.templates.list')} flush>
                {templates.length === 0 ? (
                    <TenantEmptyState icon={FileText} title={t('tenant.templates.emptyTitle')} description={t('tenant.templates.emptyDescription')} />
                ) : (
                    <ul className="tenant-list">
                        {templates.map((template) => (
                            <li key={template.id} className="tenant-list__item">
                                <div>
                                    <p className="tenant-list__primary">{template.name}</p>
                                    <p className="tenant-list__secondary">{template.category} · v{template.version ?? 0}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setPreview(template)}><Eye className="size-4" /> {t('common.preview')}</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setNewVersion(template); setVersionBody(template.body ?? ''); }}>{t('tenant.templates.newVersion')}</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </TenantPanel>

            <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
                <DialogContent>
                    <h3 className="font-bold">{preview?.name}</h3>
                    <pre className="mt-4 whitespace-pre-wrap rounded bg-[rgb(var(--surface-soft))] p-4 text-sm">{preview?.body}</pre>
                </DialogContent>
            </Dialog>

            <Dialog open={newVersion !== null} onOpenChange={(o) => !o && setNewVersion(null)}>
                <DialogContent>
                    <h3 className="font-bold">{t('tenant.templates.newVersionTitle', { name: newVersion?.name ?? '' })}</h3>
                    <form onSubmit={submitVersion} className="mt-4 space-y-3">
                        <Textarea value={versionBody} onChange={(e) => setVersionBody(e.target.value)} rows={6} required />
                        <Button type="submit">{t('tenant.templates.saveNewVersion')}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </TenantShell>
    );
}
