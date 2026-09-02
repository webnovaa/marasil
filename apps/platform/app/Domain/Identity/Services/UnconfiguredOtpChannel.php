<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Contracts\OtpChannel;
use RuntimeException;

final class UnconfiguredOtpChannel implements OtpChannel
{
    public function send(string $phoneE164, string $code, string $purpose, string $locale = 'ar'): void
    {
        unset($phoneE164, $code, $purpose, $locale);

        throw new RuntimeException('OTP channel is not configured for this environment.');
    }
}
