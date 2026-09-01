import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import TenantShell from '@/Layouts/TenantShell';

type Props = {
    profile: {
        full_name: string | null;
        company_name: string | null;
        phone_e164: string | null;
        preferred_locale: string | null;
        timezone: string | null;
    };
};

export default function ProfileIndex({ profile }: Props) {
    const form = useForm({
        full_name: profile.full_name ?? '',
        company_name: profile.company_name ?? '',
        preferred_locale: profile.preferred_locale ?? 'ar',
        timezone: profile.timezone ?? 'UTC',
    });

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        form.post('/profile');
    }

    return (
        <TenantShell title="الملف الشخصي" description="بيانات الحساب. رقم الهاتف يُدار عبر مسار التحقق ولا يُعدَّل من هنا.">
            <TenantPanel title="البيانات">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="full_name">الاسم</Label>
                        <Input
                            id="full_name"
                            value={form.data.full_name}
                            onChange={(e) => form.setData('full_name', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="company_name">الشركة</Label>
                        <Input
                            id="company_name"
                            value={form.data.company_name}
                            onChange={(e) => form.setData('company_name', e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-[rgb(var(--muted))]" dir="ltr">
                        {profile.phone_e164}
                    </p>
                    <Button type="submit" disabled={form.processing}>
                        حفظ
                    </Button>
                </form>
            </TenantPanel>
        </TenantShell>
    );
}
