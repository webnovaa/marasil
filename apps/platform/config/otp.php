<?php

declare(strict_types=1);

return [
    'ttl_minutes' => (int) env('OTP_TTL_MINUTES', 5),
    'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
    'length' => (int) env('OTP_LENGTH', 6),
    'pepper' => env('OTP_PEPPER', ''),
    'expose_for_tests' => (bool) env('OTP_EXPOSE_FOR_TESTS', env('APP_ENV') === 'local'),

    /*
    | Channels: fake (local/testing log), whatsapp (platform official device), unconfigured
    */
    'channel' => (string) env('OTP_CHANNEL', 'auto'),

    'resend_cooldown_seconds' => (int) env('OTP_RESEND_COOLDOWN_SECONDS', 60),
];
