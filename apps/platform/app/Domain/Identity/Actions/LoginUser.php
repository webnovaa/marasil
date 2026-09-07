<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class LoginUser
{
    /**
     * @return array{user: User, auth_session: AuthSession}
     */
    public function handle(
        string $phoneE164,
        string $password,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $deviceName = null,
    ): array {
        /** @var User|null $user */
        $user = User::query()->where('phone_e164', $phoneE164)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            SecurityEvent::query()->create([
                'user_id' => $user?->id,
                'type' => 'login_failed',
                'severity' => 'warning',
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'context' => ['phone_e164' => $phoneE164],
            ]);

            throw ValidationException::withMessages([
                'phone_e164' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        if ($user->status === UserStatus::PendingPhoneVerification) {
            throw new HttpException(403, 'PHONE_NOT_VERIFIED');
        }

        if ($user->status === UserStatus::PendingApproval) {
            throw new HttpException(403, 'ACCOUNT_PENDING_APPROVAL');
        }

        if (in_array($user->status, [UserStatus::Suspended, UserStatus::Disabled, UserStatus::Rejected], true)) {
            throw new HttpException(403, 'ACCOUNT_SUSPENDED');
        }

        if (! $user->status->canLogin()) {
            throw new HttpException(403, 'FORBIDDEN');
        }

        Auth::guard('web')->login($user, remember: true);

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ])->save();

        $authSession = AuthSession::query()->create([
            'user_id' => $user->id,
            'token_family_id' => (string) Str::ulid(),
            'device_name' => $deviceName,
            'user_agent' => $userAgent,
            'ip_address' => $ip,
            'last_used_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);

        if (request()->hasSession()) {
            request()->session()->put('auth_session_ulid', $authSession->ulid);
        }

        SecurityEvent::query()->create([
            'user_id' => $user->id,
            'type' => 'login_success',
            'severity' => 'info',
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'context' => ['auth_session_ulid' => $authSession->ulid],
        ]);

        return [
            'user' => $user->fresh(['profile', 'roles']),
            'auth_session' => $authSession,
        ];
    }
}
