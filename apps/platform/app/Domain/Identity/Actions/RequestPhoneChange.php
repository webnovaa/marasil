<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\PhoneVerification;
use App\Domain\Identity\Models\SecurityEvent;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class RequestPhoneChange
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    public function handle(
        User $user,
        string $newPhoneE164,
        string $currentPassword,
        ?string $ip = null,
        ?string $userAgent = null,
    ): PhoneVerification {
        if (! Hash::check($currentPassword, (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('messages.flash.current_password_invalid')],
            ]);
        }

        if ($newPhoneE164 === $user->phone_e164) {
            throw ValidationException::withMessages([
                'phone_e164' => [__('messages.flash.phone_unchanged')],
            ]);
        }

        $taken = User::query()
            ->where('phone_e164', $newPhoneE164)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                'phone_e164' => [__('messages.flash.phone_taken')],
            ]);
        }

        $verification = $this->otpService->issue(
            phoneE164: $newPhoneE164,
            purpose: PhoneVerificationPurpose::PhoneChange,
            user: $user,
            ip: $ip,
        );

        SecurityEvent::query()->create([
            'user_id' => $user->id,
            'type' => 'phone_change_requested',
            'severity' => 'warning',
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'context' => [
                'from' => $user->phone_e164,
                'to' => $newPhoneE164,
            ],
        ]);

        return $verification;
    }
}
