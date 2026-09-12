<?php

declare(strict_types=1);

namespace App\Support;

final class Spintax
{
    /**
     * Parse and randomize Spintax patterns such as "{Hello|Hi|Greetings} friend".
     * Supports nested patterns, e.g. "{مرحباً {يا غالي|صديقي}|أهلاً وسهلاً}".
     */
    public static function process(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        if (! str_contains($text, '{') || ! str_contains($text, '}')) {
            return $text;
        }

        $result = $text;
        $maxIterations = 20;

        while ($maxIterations-- > 0 && preg_match('/\{([^{}]+)\}/u', $result, $matches)) {
            $options = explode('|', $matches[1]);
            $selected = $options[array_rand($options)];
            $result = substr_replace($result, $selected, (int) strpos($result, $matches[0]), strlen($matches[0]));
        }

        return $result;
    }
}
