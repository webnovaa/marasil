<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Actions\ChangePassword;
use App\Domain\Identity\Actions\ConfirmPhoneChange;
use App\Domain\Identity\Actions\RequestPhoneChange;
use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Http\Controllers\Controller;
use App\Rules\WhatsAppE164Phone;
use App\Support\Phone\PhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Throwable;

final class ProfilePageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('profile');

        $currentSessionUlid = $request->session()->get('auth_session_ulid');

        $sessions = AuthSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->where(function ($q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('last_used_at')
            ->limit(20)
            ->get()
            ->map(fn (AuthSession $session): array => [
                'id' => $session->ulid,
                'device_name' => $session->device_name,
                'ip_address' => $session->ip_address,
                'user_agent' => $session->user_agent,
                'last_used_at' => $session->last_used_at?->toIso8601String(),
                'is_current' => $currentSessionUlid !== null && $session->ulid === $currentSessionUlid,
            ]);

        return Inertia::render('Tenant/Profile/Index', [
            'profile' => [
                'full_name' => $user->profile?->full_name,
                'company_name' => $user->profile?->company_name,
                'email' => $user->profile?->email,
                'country_code' => $user->profile?->country_code,
                'phone_e164' => $user->phone_e164,
                'phone_verified_at' => $user->phone_verified_at?->toIso8601String(),
                'preferred_locale' => $user->preferred_locale,
                'timezone' => $user->timezone,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'last_login_ip' => $user->last_login_ip,
            ],
            'sessions' => $sessions,
            'pending_phone_change' => $request->session()->get('pending_phone_change'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('profile');

        $request->merge([
            'country_code' => filled($request->input('country_code'))
                ? strtoupper((string) $request->input('country_code'))
                : null,
            'email' => filled($request->input('email')) ? $request->input('email') : null,
            'company_name' => filled($request->input('company_name')) ? $request->input('company_name') : null,
        ]);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'company_name' => ['nullable', 'string', 'max:160'],
            'email' => [
                'nullable',
                'email',
                'max:160',
                Rule::unique('user_profiles', 'email')->ignore($user->profile?->id),
            ],
            'country_code' => ['nullable', 'string', 'size:2'],
            'preferred_locale' => ['required', 'in:ar,en'],
            'timezone' => ['required', 'timezone:all'],
        ]);

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => $data['full_name'],
                'company_name' => $data['company_name'] ?? null,
                'email' => $data['email'] ?? null,
                'country_code' => $data['country_code'] ?? null,
            ],
        );

        $user->forceFill([
            'preferred_locale' => $data['preferred_locale'],
            'timezone' => $data['timezone'],
        ])->save();

        $request->session()->put('locale', $data['preferred_locale']);

        return back()->with('success', __('messages.flash.profile_saved'));
    }

    public function changePassword(Request $request, ChangePassword $action, PlatformWhatsAppService $whatsapp): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'revoke_other_sessions' => ['sometimes', 'boolean'],
        ]);

        $action->handle(
            user: $user,
            currentPassword: $data['current_password'],
            newPassword: $data['password'],
            revokeOtherSessions: (bool) ($data['revoke_other_sessions'] ?? true),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            keepSessionUlid: $request->session()->get('auth_session_ulid'),
        );

        $this->safeWhatsApp(
            $whatsapp,
            (string) $user->phone_e164,
            'مراسيل: تم تغيير كلمة المرور لحسابك. إذا لم تكن أنت، غيّر كلمة المرور فوراً وتواصل مع الدعم.',
        );

        return back()->with('success', __('messages.flash.password_changed'));
    }

    public function requestPhoneChange(Request $request, RequestPhoneChange $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->normalizeIncomingPhone($request);

        $data = $request->validate([
            'phone_e164' => ['required', 'string', 'max:20', new WhatsAppE164Phone],
            'current_password' => ['required', 'string'],
        ]);

        $action->handle(
            user: $user,
            newPhoneE164: $data['phone_e164'],
            currentPassword: $data['current_password'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $request->session()->put('pending_phone_change', $data['phone_e164']);

        return back()->with('success', __('messages.flash.phone_otp_sent'));
    }

    public function confirmPhoneChange(
        Request $request,
        ConfirmPhoneChange $action,
        PlatformWhatsAppService $whatsapp,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        $this->normalizeIncomingPhone($request);
        $pending = $request->session()->get('pending_phone_change');

        $data = $request->validate([
            'code' => ['required', 'string', 'min:4', 'max:8'],
            'phone_e164' => ['nullable', 'string', 'max:20', new WhatsAppE164Phone],
        ]);

        $newPhone = is_string($data['phone_e164'] ?? null) && $data['phone_e164'] !== ''
            ? $data['phone_e164']
            : (is_string($pending) ? $pending : null);

        if ($newPhone === null || $newPhone === '') {
            throw ValidationException::withMessages([
                'phone_e164' => [__('messages.flash.phone_change_missing')],
            ]);
        }

        $previous = (string) $user->phone_e164;

        $action->handle(
            user: $user,
            newPhoneE164: $newPhone,
            code: $data['code'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        $request->session()->forget('pending_phone_change');

        $this->safeWhatsApp(
            $whatsapp,
            $previous,
            "مراسيل: تم نقل حسابك إلى رقم جديد ({$newPhone}). إذا لم تكن أنت، تواصل مع الدعم فوراً.",
        );

        return back()->with('success', __('messages.flash.phone_changed'));
    }

    public function resendPhoneChangeOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $pending = $request->session()->get('pending_phone_change');

        if (! is_string($pending) || $pending === '') {
            throw ValidationException::withMessages([
                'phone_e164' => [__('messages.flash.phone_change_missing')],
            ]);
        }

        $otpService->issue(
            phoneE164: $pending,
            purpose: PhoneVerificationPurpose::PhoneChange,
            user: $user,
            ip: $request->ip(),
        );

        return back()->with('success', __('messages.flash.phone_otp_sent'));
    }

    public function cancelPhoneChange(Request $request): RedirectResponse
    {
        $request->session()->forget('pending_phone_change');

        return back()->with('success', __('messages.flash.phone_change_cancelled'));
    }

    public function revokeSession(Request $request, string $sessionUlid): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $current = $request->session()->get('auth_session_ulid');

        if ($current !== null && $sessionUlid === $current) {
            throw ValidationException::withMessages([
                'session' => [__('messages.flash.cannot_revoke_current_session')],
            ]);
        }

        $session = AuthSession::query()
            ->where('user_id', $user->id)
            ->where('ulid', $sessionUlid)
            ->whereNull('revoked_at')
            ->firstOrFail();

        $session->update(['revoked_at' => now()]);

        return back()->with('success', __('messages.flash.session_revoked'));
    }

    public function revokeOtherSessions(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $current = $request->session()->get('auth_session_ulid');

        $query = AuthSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at');

        if (is_string($current) && $current !== '') {
            $query->where('ulid', '!=', $current);
        }

        $query->update(['revoked_at' => now()]);

        return back()->with('success', __('messages.flash.other_sessions_revoked'));
    }

    private function normalizeIncomingPhone(Request $request, string $field = 'phone_e164'): void
    {
        $raw = $request->input($field);
        if (! is_string($raw) || trim($raw) === '') {
            return;
        }

        try {
            $request->merge([$field => PhoneNumber::normalizeToE164($raw)]);
        } catch (InvalidArgumentException) {
            // Leave as-is; WhatsAppE164Phone rule will fail validation.
        }
    }

    private function safeWhatsApp(PlatformWhatsAppService $whatsapp, string $phone, string $text): void
    {
        if ($phone === '') {
            return;
        }

        try {
            $whatsapp->sendOtpMessage($phone, $text);
        } catch (Throwable) {
            // Best-effort security notice.
        }
    }
}
