<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\Spintax;
use PHPUnit\Framework\TestCase;

final class SpintaxTest extends TestCase
{
    public function test_plain_text_remains_unchanged(): void
    {
        $text = 'مرحبا بك في متجرنا';
        $this->assertSame($text, Spintax::process($text));
    }

    public function test_simple_spintax_resolves_to_one_of_options(): void
    {
        $pattern = '{مرحباً|أهلاً|السلام عليكم} يا غالي';
        $results = [];

        for ($i = 0; $i < 30; $i++) {
            $spun = Spintax::process($pattern);
            $results[$spun] = true;
            $this->assertMatchesRegularExpression('/^(مرحباً|أهلاً|السلام عليكم) يا غالي$/u', $spun);
        }

        // Over 30 iterations, at least 2 distinct variations should be generated
        $this->assertGreaterThan(1, count($results));
    }

    public function test_nested_spintax(): void
    {
        $pattern = '{أهلاً {بك|عزيزي}|مرحباً}';
        $spun = Spintax::process($pattern);
        $this->assertContains($spun, ['أهلاً بك', 'أهلاً عزيزي', 'مرحباً']);
    }
}
