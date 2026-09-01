<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Phone\PhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class PhoneNumberTest extends TestCase
{
    public function test_normalizes_syrian_mobile(): void
    {
        $e164 = PhoneNumber::normalizeToE164('+963944123456');

        $this->assertSame('+963944123456', $e164);
    }

    public function test_rejects_invalid_number(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        PhoneNumber::normalizeToE164('+96312');
    }

    #[DataProvider('validNumbers')]
    public function test_accepts_known_mobiles(string $raw): void
    {
        $this->assertTrue(PhoneNumber::isValidWhatsAppMobile($raw));
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function validNumbers(): array
    {
        return [
            'syria' => ['+963944123456'],
            'saudi' => ['+966501234567'],
            'uae' => ['+971501234567'],
        ];
    }
}
