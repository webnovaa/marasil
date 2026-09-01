<?php

declare(strict_types=1);

namespace App\Domain\Identity\Actions;

use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\OtpService;

final class ForgotPassword
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    /**
     * Always succeeds outwardly to avoid phone enumeration.
     */
    public function handle(string $phoneE164, ?string $ip = null): void
    {
        /** @var User|null $user */
        $user = User::query()->where('phone_e164', $phoneE164)->first();

        if ($user === null) {
            return;
        }

        $this->otpService->issue(
            phoneE164: $phoneE164,
            purpose: PhoneVerificationPurpose::PasswordReset,
            user: $user,
            ip: $ip,
        );
    }
}
