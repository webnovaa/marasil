<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ConfirmPhoneChange
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    public function handle(
        User $user,
        string $newPhoneE164,
        string $code,
        ?string $ip = null,
        ?string $userAgent = null,
    ): User {
        return DB::transaction(function () use ($user, $newPhoneE164, $code, $ip, $userAgent): User {
            $this->otpService->verify(
                phoneE164: $newPhoneE164,
                purpose: PhoneVerificationPurpose::PhoneChange,
                code: $code,
            );

            $taken = User::query()
                ->where('phone_e164', $newPhoneE164)
                ->where('id', '!=', $user->id)
                ->lockForUpdate()
                ->exists();

            if ($taken) {
                throw ValidationException::withMessages([
                    'phone_e164' => [__('messages.flash.phone_taken')],
                ]);
            }

            $previous = $user->phone_e164;

            $user->forceFill([
                'phone_e164' => $newPhoneE164,
                'phone_verified_at' => now(),
            ])->save();

            SecurityEvent::query()->create([
                'user_id' => $user->id,
                'type' => 'phone_changed',
                'severity' => 'critical',
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'context' => [
                    'from' => $previous,
                    'to' => $newPhoneE164,
                ],
            ]);

            return $user->fresh(['profile']) ?? $user;
        });
    }
}
