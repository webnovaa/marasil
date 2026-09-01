<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\PhoneVerification;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;
use Illuminate\Validation\ValidationException;

final class ResendOtp
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    public function handle(
        string $phoneE164,
        PhoneVerificationPurpose $purpose = PhoneVerificationPurpose::Registration,
        ?string $ip = null,
    ): void {
        /** @var User|null $user */
        $user = User::query()->where('phone_e164', $phoneE164)->first();

        if ($user === null) {
            // Uniform response — do not reveal whether the phone exists.
            return;
        }

        if ($purpose === PhoneVerificationPurpose::Registration
            && $user->status !== UserStatus::PendingPhoneVerification) {
            throw ValidationException::withMessages([
                'phone_e164' => ['لا يمكن إعادة إرسال رمز التحقق لهذه الحالة.'],
            ]);
        }

        $cooldown = (int) config('otp.resend_cooldown_seconds', 60);
        $recent = PhoneVerification::query()
            ->where('phone_e164', $phoneE164)
            ->where('purpose', $purpose->value)
            ->where('created_at', '>=', now()->subSeconds($cooldown))
            ->exists();

        if ($recent) {
            throw ValidationException::withMessages([
                'phone_e164' => ['يرجى الانتظار قبل طلب رمز جديد.'],
            ]);
        }

        $this->otpService->issue(
            phoneE164: $phoneE164,
            purpose: $purpose,
            user: $user,
            ip: $ip,
        );
    }
}
