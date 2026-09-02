import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import TenantShell from '@/Layouts/TenantShell';
import { useI18n } from '@/i18n/useI18n';

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
    const { t } = useI18n();
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
        <TenantShell title={t('nav.profile')} description={t('profile.locale')}>
            <TenantPanel title={t('nav.profile')}>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="full_name">{t('nav.profile')}</Label>
                        <Input
                            id="full_name"
                            value={form.data.full_name}
                            onChange={(e) => form.setData('full_name', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="company_name">Company</Label>
                        <Input
                            id="company_name"
                            value={form.data.company_name}
                            onChange={(e) => form.setData('company_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="preferred_locale">{t('profile.locale')}</Label>
                        <Select
                            value={form.data.preferred_locale}
                            onValueChange={(value) => form.setData('preferred_locale', value)}
                        >
                            <SelectTrigger id="preferred_locale">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ar">{t('profile.localeAr')}</SelectItem>
                                <SelectItem value="en">{t('profile.localeEn')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                            {form.data.preferred_locale === 'en'
                                ? 'OTP and notifications will be sent in English.'
                                : 'ستُرسل رموز التحقق والإشعارات بالعربية.'}
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="timezone">{t('profile.timezone')}</Label>
                        <Input
                            id="timezone"
                            value={form.data.timezone}
                            onChange={(e) => form.setData('timezone', e.target.value)}
                            dir="ltr"
                        />
                    </div>
                    <p className="text-sm text-[rgb(var(--muted))]" dir="ltr">
                        {profile.phone_e164}
                    </p>
                    <Button type="submit" disabled={form.processing}>
                        {t('common.save')}
                    </Button>
                </form>
            </TenantPanel>
        </TenantShell>
    );
}
