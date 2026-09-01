<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Contracts\OtpChannel;
use App\Domain\Identity\Enums\PhoneVerificationPurpose;
use App\Domain\Identity\Models\PhoneVerification;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class OtpService
{
    public function __construct(
        private readonly OtpChannel $channel,
    ) {}

    public function issue(
        string $phoneE164,
        PhoneVerificationPurpose $purpose,
        ?User $user = null,
        ?string $ip = null,
    ): PhoneVerification {
        $code = $this->generateCode();
        $ttl = (int) config('otp.ttl_minutes', 5);

        $verification = DB::transaction(function () use ($phoneE164, $purpose, $user, $ip, $code, $ttl): PhoneVerification {
            PhoneVerification::query()
                ->where('phone_e164', $phoneE164)
                ->where('purpose', $purpose->value)
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->update(['consumed_at' => now()]);

            return PhoneVerification::query()->create([
                'user_id' => $user?->id,
                'phone_e164' => $phoneE164,
                'purpose' => $purpose,
                'code_hash' => $this->hashCode($code),
                'attempts' => 0,
                'max_attempts' => (int) config('otp.max_attempts', 5),
                'expires_at' => now()->addMinutes($ttl),
                'requested_ip' => $ip,
            ]);
        });

        $this->channel->send($phoneE164, $code, $purpose->value);

        return $verification;
    }

    public function verify(
        string $phoneE164,
        PhoneVerificationPurpose $purpose,
        string $code,
    ): PhoneVerification {
        /** @var PhoneVerification|null $verification */
        $verification = PhoneVerification::query()
            ->where('phone_e164', $phoneE164)
            ->where('purpose', $purpose->value)
            ->whereNull('consumed_at')
            ->orderByDesc('id')
            ->first();

        if ($verification === null) {
            throw ValidationException::withMessages([
                'code' => ['رمز التحقق غير صالح أو منتهٍ.'],
            ]);
        }

        if ($verification->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['انتهت صلاحية رمز التحقق.'],
            ]);
        }

        if (! $verification->hasAttemptsRemaining()) {
            throw ValidationException::withMessages([
                'code' => ['تم تجاوز عدد محاولات التحقق المسموحة.'],
            ]);
        }

        $verification->increment('attempts');
        $verification->refresh();

        if (! hash_equals($verification->code_hash, $this->hashCode($code))) {
            throw ValidationException::withMessages([
                'code' => ['رمز التحقق غير صحيح.'],
            ]);
        }

        $verification->forceFill(['consumed_at' => now()])->save();

        return $verification;
    }

    public function hashCode(string $code): string
    {
        $pepper = (string) config('otp.pepper', '');

        if ($pepper === '' && ! app()->environment('testing', 'local')) {
            throw new RuntimeException('OTP_PEPPER must be configured.');
        }

        return hash('sha256', $code.$pepper);
    }

    private function generateCode(): string
    {
        $length = max(4, (int) config('otp.length', 6));
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }
}
