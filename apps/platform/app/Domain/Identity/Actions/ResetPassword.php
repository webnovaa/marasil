<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ResetPassword
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    public function handle(
        string $phoneE164,
        string $code,
        string $password,
        ?string $ip = null,
        ?string $userAgent = null,
    ): User {
        return DB::transaction(function () use ($phoneE164, $code, $password, $ip, $userAgent): User {
            $this->otpService->verify(
                phoneE164: $phoneE164,
                purpose: PhoneVerificationPurpose::PasswordReset,
                code: $code,
            );

            /** @var User|null $user */
            $user = User::query()->where('phone_e164', $phoneE164)->first();

            if ($user === null) {
                throw ValidationException::withMessages([
                    'phone_e164' => ['تعذر إعادة تعيين كلمة المرور.'],
                ]);
            }

            $user->forceFill(['password' => $password])->save();

            AuthSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            SecurityEvent::query()->create([
                'user_id' => $user->id,
                'type' => 'password_reset',
                'severity' => 'warning',
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'context' => [],
            ]);

            return $user->fresh(['profile']);
        });
    }
}
