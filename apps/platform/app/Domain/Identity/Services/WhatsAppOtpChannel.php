<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Contracts\OtpChannel;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use Illuminate\Support\Facades\Log;
use RuntimeException;

final class WhatsAppOtpChannel implements OtpChannel
{
    public function __construct(
        private readonly PlatformWhatsAppService $platformWhatsApp,
    ) {}

    public function send(string $phoneE164, string $code, string $purpose, string $locale = 'ar'): void
    {
        $locale = in_array($locale, ['ar', 'en'], true) ? $locale : 'ar';
        $appName = (string) __('messages.app_name', [], $locale);
        $purposeLabel = (string) __("messages.otp.purposes.{$purpose}", [], $locale);
        $template = (string) __("messages.otp.body", [
            'app' => $appName,
            'code' => $code,
            'purpose' => $purposeLabel,
            'minutes' => (int) config('otp.ttl_minutes', 5),
        ], $locale);

        try {
            $this->platformWhatsApp->sendOtpMessage($phoneE164, $template);
        } catch (RuntimeException $e) {
            Log::error('WhatsApp OTP send failed', [
                'phone' => $phoneE164,
                'purpose' => $purpose,
                'locale' => $locale,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
