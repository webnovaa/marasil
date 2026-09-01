<?php

declare(strict_types=1);

namespace App\Rules;

use App\Support\Phone\PhoneNumber;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class WhatsAppE164Phone implements ValidationRule
{
    public function __construct(
        private readonly ?string $defaultRegion = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            $fail('رقم واتساب مطلوب.');

            return;
        }

        try {
            PhoneNumber::normalizeToE164($value, $this->defaultRegion);
        } catch (\InvalidArgumentException $e) {
            $fail($e->getMessage());
        }
    }
}
