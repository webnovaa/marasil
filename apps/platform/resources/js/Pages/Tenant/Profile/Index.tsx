import { FormEvent, useMemo, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { WhatsAppPhoneField } from '@/Components/patterns/WhatsAppPhoneField';
import { TenantPanel } from '@/Components/patterns/tenant/TenantPanel';
import { Alert } from '@/Components/ui/Alert';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { PasswordInput } from '@/Components/ui/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import TenantShell from '@/Layouts/TenantShell';
import { useI18n } from '@/i18n/useI18n';

type SessionRow = {
    id: string;
    device_name: string | null;
    ip_address: string | null;
    user_agent: string | null;
    last_used_at: string | null;
    is_current: boolean;
};

type Props = {
    profile: {
        full_name: string | null;
        company_name: string | null;
        email: string | null;
        country_code: string | null;
        phone_e164: string | null;
        phone_verified_at: string | null;
        preferred_locale: string | null;
        timezone: string | null;
        last_login_at: string | null;
        last_login_ip: string | null;
    };
    sessions: SessionRow[];
    pending_phone_change: string | null;
};

const COMMON_TIMEZONES = [
    'Asia/Damascus',
    'Asia/Riyadh',
    'Asia/Dubai',
    'Asia/Kuwait',
    'Asia/Baghdad',
    'Asia/Amman',
    'Asia/Beirut',
    'Africa/Cairo',
    'Europe/Istanbul',
    'Europe/London',
    'UTC',
];

export default function ProfileIndex({ profile, sessions, pending_phone_change }: Props) {
    const { t, formatDate } = useI18n();
    const page = usePage<{ flash?: { success?: string | null; error?: string | null }; errors?: Record<string, string> }>();
    const flashSuccess = page.props.flash?.success ?? null;
    const flashError = page.props.flash?.error ?? null;
    const pageErrors = page.props.errors ?? {};

    const profileForm = useForm({
        full_name: profile.full_name ?? '',
        company_name: profile.company_name ?? '',
        email: profile.email ?? '',
        country_code: profile.country_code ?? '',
        preferred_locale: profile.preferred_locale ?? 'ar',
        timezone: profile.timezone ?? 'Asia/Damascus',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
        revoke_other_sessions: true as boolean,
    });

    const [newPhone, setNewPhone] = useState('');
    const [phonePassword, setPhonePassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [phoneBusy, setPhoneBusy] = useState(false);

    const timezones = useMemo(() => {
        const set = new Set(COMMON_TIMEZONES);
        if (profile.timezone) {
            set.add(profile.timezone);
        }
        return Array.from(set);
    }, [profile.timezone]);

    function onSaveProfile(e: FormEvent) {
        e.preventDefault();
        profileForm.post('/profile');
    }

    function onChangePassword(e: FormEvent) {
        e.preventDefault();
        passwordForm.post('/profile/password', {
            onSuccess: () => passwordForm.reset('current_password', 'password', 'password_confirmation'),
        });
    }

    function requestPhoneChange(e: FormEvent) {
        e.preventDefault();
        setPhoneBusy(true);
        router.post(
            '/profile/phone/request',
            { phone_e164: newPhone, current_password: phonePassword },
            {
                preserveScroll: true,
                onFinish: () => setPhoneBusy(false),
            },
        );
    }

    function confirmPhoneChange(e: FormEvent) {
        e.preventDefault();
        setPhoneBusy(true);
        router.post(
            '/profile/phone/confirm',
            { code: otpCode, phone_e164: pending_phone_change },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPhoneBusy(false);
                    setOtpCode('');
                    setPhonePassword('');
                    setNewPhone('');
                },
            },
        );
    }

    return (
        <TenantShell title={t('nav.profile')} description={t('profile.description')}>
            <div className="space-y-6">
                {flashSuccess ? <Alert tone="success" title={flashSuccess} /> : null}
                {flashError ? <Alert tone="danger" title={flashError} /> : null}

                <Alert tone="neutral" title={t('profile.securityNote')} />

                <TenantPanel title={t('profile.personalTitle')}>
                    <form onSubmit={onSaveProfile} className="space-y-4">
                        <FormField id="full_name" label={t('profile.fullName')} error={profileForm.errors.full_name}>
                            <Input
                                id="full_name"
                                value={profileForm.data.full_name}
                                onChange={(e) => profileForm.setData('full_name', e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField id="company_name" label={t('profile.company')} error={profileForm.errors.company_name}>
                            <Input
                                id="company_name"
                                value={profileForm.data.company_name}
                                onChange={(e) => profileForm.setData('company_name', e.target.value)}
                            />
                        </FormField>
                        <FormField id="email" label={t('profile.email')} error={profileForm.errors.email}>
                            <Input
                                id="email"
                                type="email"
                                dir="ltr"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                            />
                        </FormField>
                        <FormField id="country_code" label={t('profile.country')} error={profileForm.errors.country_code}>
                            <Input
                                id="country_code"
                                dir="ltr"
                                maxLength={2}
                                placeholder="SY"
                                value={profileForm.data.country_code}
                                onChange={(e) => profileForm.setData('country_code', e.target.value.toUpperCase())}
                            />
                        </FormField>
                        <FormField id="preferred_locale" label={t('profile.locale')}>
                            <Select
                                value={profileForm.data.preferred_locale}
                                onValueChange={(value) => profileForm.setData('preferred_locale', value)}
                            >
                                <SelectTrigger id="preferred_locale">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ar">{t('profile.localeAr')}</SelectItem>
                                    <SelectItem value="en">{t('profile.localeEn')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField id="timezone" label={t('profile.timezone')} error={profileForm.errors.timezone}>
                            <Select
                                value={profileForm.data.timezone}
                                onValueChange={(value) => profileForm.setData('timezone', value)}
                            >
                                <SelectTrigger id="timezone">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        {(profile.last_login_at || profile.last_login_ip) && (
                            <p className="text-sm text-[rgb(var(--muted))]">
                                {t('profile.lastLogin')}:{' '}
                                <span dir="ltr">
                                    {profile.last_login_at ? formatDate(profile.last_login_at) : '—'}
                                    {profile.last_login_ip ? ` · ${profile.last_login_ip}` : ''}
                                </span>
                            </p>
                        )}
                        <Button type="submit" loading={profileForm.processing}>
                            {t('common.save')}
                        </Button>
                    </form>
                </TenantPanel>

                <TenantPanel title={t('profile.phoneTitle')}>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div>
                            <p className="text-caption text-[rgb(var(--muted))]">{t('profile.currentPhone')}</p>
                            <p className="font-semibold" dir="ltr">
                                {profile.phone_e164 ?? '—'}
                            </p>
                        </div>
                        <Badge tone={profile.phone_verified_at ? 'success' : 'warning'}>
                            <ShieldCheck className="me-1 size-3.5" />
                            {profile.phone_verified_at ? t('profile.verified') : t('profile.unverified')}
                        </Badge>
                    </div>

                    {pending_phone_change ? (
                        <form onSubmit={confirmPhoneChange} className="space-y-4">
                            <Alert tone="warning" title={t('profile.otpHint')}>
                                <span dir="ltr">{pending_phone_change}</span>
                            </Alert>
                            <FormField id="otp_code" label={t('profile.otpCode')} error={pageErrors.code}>
                                <Input
                                    id="otp_code"
                                    dir="ltr"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    required
                                />
                            </FormField>
                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" loading={phoneBusy}>
                                    {t('profile.confirmOtp')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={phoneBusy}
                                    onClick={() => router.post('/profile/phone/resend')}
                                >
                                    {t('profile.resendOtp')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={phoneBusy}
                                    onClick={() => router.post('/profile/phone/cancel')}
                                >
                                    {t('profile.cancelPhoneChange')}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={requestPhoneChange} className="space-y-4">
                            <WhatsAppPhoneField
                                id="new_phone"
                                label={t('profile.newPhone')}
                                value={newPhone}
                                onChange={setNewPhone}
                                error={pageErrors.phone_e164}
                            />
                            <FormField
                                id="phone_current_password"
                                label={t('profile.currentPassword')}
                                error={pageErrors.current_password}
                            >
                                <PasswordInput
                                    id="phone_current_password"
                                    value={phonePassword}
                                    onChange={(e) => setPhonePassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </FormField>
                            <Button type="submit" loading={phoneBusy} disabled={!newPhone}>
                                {t('profile.sendOtp')}
                            </Button>
                        </form>
                    )}
                </TenantPanel>

                <TenantPanel title={t('profile.passwordTitle')}>
                    <form onSubmit={onChangePassword} className="space-y-4">
                        <FormField
                            id="current_password"
                            label={t('profile.currentPassword')}
                            error={passwordForm.errors.current_password}
                        >
                            <PasswordInput
                                id="current_password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </FormField>
                        <FormField id="password" label={t('profile.newPassword')} error={passwordForm.errors.password}>
                            <PasswordInput
                                id="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField
                            id="password_confirmation"
                            label={t('profile.confirmPassword')}
                            error={passwordForm.errors.password_confirmation}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </FormField>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={passwordForm.data.revoke_other_sessions}
                                onChange={(e) => passwordForm.setData('revoke_other_sessions', e.target.checked)}
                            />
                            {t('profile.revokeOtherSessions')}
                        </label>
                        <Button type="submit" loading={passwordForm.processing}>
                            {t('profile.updatePassword')}
                        </Button>
                    </form>
                </TenantPanel>

                <TenantPanel
                    title={t('profile.sessionsTitle')}
                    description={t('profile.sessionsDescription')}
                    action={
                        sessions.some((s) => !s.is_current) ? (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => router.post('/profile/sessions/revoke-others')}
                            >
                                {t('profile.revokeOthers')}
                            </Button>
                        ) : null
                    }
                >
                    {sessions.length === 0 ? (
                        <p className="text-body-sm text-[rgb(var(--muted))]">{t('profile.noSessions')}</p>
                    ) : (
                        <ul className="divide-y divide-[rgb(var(--border-soft))]">
                            {sessions.map((session) => (
                                <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-[rgb(var(--brand-950))]">
                                            {session.device_name || session.user_agent?.slice(0, 64) || session.id}
                                            {session.is_current ? (
                                                <Badge tone="success" className="ms-2">
                                                    {t('profile.currentSession')}
                                                </Badge>
                                            ) : null}
                                        </p>
                                        <p className="text-caption text-[rgb(var(--muted))]" dir="ltr">
                                            {session.ip_address ?? '—'}
                                            {session.last_used_at ? ` · ${formatDate(session.last_used_at)}` : ''}
                                        </p>
                                    </div>
                                    {!session.is_current ? (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => router.delete(`/profile/sessions/${session.id}`)}
                                        >
                                            {t('profile.revokeSession')}
                                        </Button>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </TenantPanel>
            </div>
        </TenantShell>
    );
}
