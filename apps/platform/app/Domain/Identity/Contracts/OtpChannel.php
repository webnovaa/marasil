<?php

declare(strict_types=1);

namespace App\Domain\Identity\Contracts;

interface OtpChannel
{
    /**
     * Dispatch an OTP to the given phone. Implementations must never log the raw code.
     */
    public function send(string $phoneE164, string $code, string $purpose): void;
}
