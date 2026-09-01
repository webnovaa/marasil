<?php

declare(strict_types=1);

return [
    'ttl_minutes' => (int) env('OTP_TTL_MINUTES', 5),
    'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
    'length' => (int) env('OTP_LENGTH', 6),
    'pepper' => env('OTP_PEPPER', ''),
    'expose_for_tests' => (bool) env('OTP_EXPOSE_FOR_TESTS', env('APP_ENV') === 'local'),
];
