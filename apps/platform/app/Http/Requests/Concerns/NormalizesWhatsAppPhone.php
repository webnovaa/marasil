<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Support\Phone\PhoneNumber;

trait NormalizesWhatsAppPhone
{
    protected function normalizePhoneField(string $field = 'phone_e164'): void
    {
        $raw = $this->input($field);
        if (! is_string($raw) || trim($raw) === '') {
            return;
        }

        try {
            $this->merge([
                $field => PhoneNumber::normalizeToE164($raw),
            ]);
        } catch (\InvalidArgumentException) {
            // Leave as-is; WhatsAppE164Phone rule will fail validation.
        }
    }
}
