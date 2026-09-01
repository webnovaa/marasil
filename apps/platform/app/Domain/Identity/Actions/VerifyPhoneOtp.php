<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use App\Domain\Tenancy\Enums\TenantStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class VerifyPhoneOtp
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    public function handle(string $phoneE164, string $code, ?string $ip = null, ?string $userAgent = null): User
    {
        return DB::transaction(function () use ($phoneE164, $code, $ip, $userAgent): User {
            $this->otpService->verify(
                phoneE164: $phoneE164,
                purpose: PhoneVerificationPurpose::Registration,
                code: $code,
            );

            /** @var User|null $user */
            $user = User::query()->where('phone_e164', $phoneE164)->first();

            if ($user === null) {
                throw ValidationException::withMessages([
                    'phone_e164' => ['الحساب غير موجود.'],
                ]);
            }

            if ($user->status !== UserStatus::PendingPhoneVerification) {
                throw ValidationException::withMessages([
                    'phone_e164' => ['تم التحقق من هذا الرقم مسبقاً.'],
                ]);
            }

            $user->forceFill([
                'phone_verified_at' => now(),
                'status' => UserStatus::Active,
            ])->save();

            $user->ownedTenants()
                ->where('status', TenantStatus::Pending->value)
                ->update(['status' => TenantStatus::Active->value]);

            SecurityEvent::query()->create([
                'user_id' => $user->id,
                'type' => 'phone_verified',
                'severity' => 'info',
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'context' => ['phone_e164' => $phoneE164],
            ]);

            return $user->fresh(['profile']);
        });
    }
}
