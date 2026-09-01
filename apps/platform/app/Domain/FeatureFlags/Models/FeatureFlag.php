<?php

declare(strict_types=1);

namespace App\Domain\FeatureFlags\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'key',
        'enabled',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'payload' => 'array',
        ];
    }

    public static function isEnabled(string $key, bool $default = false): bool
    {
        $flag = static::query()->where('key', $key)->first();

        return $flag?->enabled ?? $default;
    }
}
