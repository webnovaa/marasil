<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Contracts\OtpChannel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

final class FakeOtpChannel implements OtpChannel
{
    public function send(string $phoneE164, string $code, string $purpose, string $locale = 'ar'): void
    {
        unset($locale);
        if ($this->shouldExposeForTests()) {
            Cache::put(
                self::testCacheKey($phoneE164, $purpose),
                $code,
                now()->addMinutes((int) config('otp.ttl_minutes', 5) + 5),
            );

            Log::info('[OTP] verification code for testing', [
                'phone' => $phoneE164,
                'purpose' => $purpose,
                'code' => $code,
            ]);

            return;
        }

        Log::info('OTP dispatched to {phone}', [
            'phone' => $phoneE164,
            'purpose' => $purpose,
        ]);
    }

    public static function peekTestCode(string $phoneE164, string $purpose): ?string
    {
        $value = Cache::get(self::testCacheKey($phoneE164, $purpose));

        return is_string($value) ? $value : null;
    }

    public static function clearTestCode(string $phoneE164, string $purpose): void
    {
        Cache::forget(self::testCacheKey($phoneE164, $purpose));
    }

    public static function testCacheKey(string $phoneE164, string $purpose): string
    {
        return "otp:test:{$phoneE164}:{$purpose}";
    }

    private function shouldExposeForTests(): bool
    {
        return app()->environment('testing', 'local')
            || (bool) config('otp.expose_for_tests', false);
    }
}
