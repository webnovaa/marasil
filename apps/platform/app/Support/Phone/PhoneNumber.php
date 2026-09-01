<?php

declare(strict_types=1);

namespace App\Support\Phone;

use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberType;
use libphonenumber\PhoneNumberUtil;

final class PhoneNumber
{
    /**
     * Normalize and validate a WhatsApp-capable mobile number to E.164.
     *
     * @throws \InvalidArgumentException
     */
    public static function normalizeToE164(string $raw, ?string $defaultRegion = null): string
    {
        $raw = trim($raw);
        if ($raw === '') {
            throw new \InvalidArgumentException('رقم الهاتف مطلوب.');
        }

        $util = PhoneNumberUtil::getInstance();

        try {
            $number = $util->parse($raw, $defaultRegion);
        } catch (NumberParseException) {
            throw new \InvalidArgumentException('تعذر قراءة رقم الهاتف.');
        }

        if (! $util->isValidNumber($number)) {
            throw new \InvalidArgumentException('رقم الهاتف غير صالح.');
        }

        $type = $util->getNumberType($number);
        $allowed = [
            PhoneNumberType::MOBILE,
            PhoneNumberType::FIXED_LINE_OR_MOBILE,
            // UNKNOWN sometimes for sparse metadata regions — still require isValidNumber above
            PhoneNumberType::UNKNOWN,
        ];

        if (! in_array($type, $allowed, true)) {
            throw new \InvalidArgumentException('يجب أن يكون رقم جوال صالح لواتساب.');
        }

        return $util->format($number, PhoneNumberFormat::E164);
    }

    public static function isValidWhatsAppMobile(string $raw, ?string $defaultRegion = null): bool
    {
        try {
            self::normalizeToE164($raw, $defaultRegion);

            return true;
        } catch (\InvalidArgumentException) {
            return false;
        }
    }
}
