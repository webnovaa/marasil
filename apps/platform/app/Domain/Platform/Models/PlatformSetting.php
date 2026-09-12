<?php

declare(strict_types=1);

namespace App\Domain\Platform\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PlatformSetting extends Model
{
    public const AI_MASTER_ENABLED = 'ai_master_enabled';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $cacheKey = 'platform_setting.'.$key;

        return Cache::remember($cacheKey, 300, function () use ($key, $default) {
            $row = static::query()->where('key', $key)->first();

            if ($row === null) {
                return $default;
            }

            return $row->value;
        });
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value],
        );

        Cache::forget('platform_setting.'.$key);
        Cache::forget('platform.ai_master_enabled');
    }

    public static function isAiMasterEnabled(): bool
    {
        $cached = Cache::get('platform.ai_master_enabled');
        if ($cached !== null) {
            return (bool) $cached;
        }

        $raw = static::getValue(self::AI_MASTER_ENABLED, '1');
        $enabled = filter_var($raw, FILTER_VALIDATE_BOOLEAN);

        Cache::forever('platform.ai_master_enabled', $enabled);

        return $enabled;
    }

    public static function setAiMasterEnabled(bool $enabled): void
    {
        static::setValue(self::AI_MASTER_ENABLED, $enabled);
        Cache::forever('platform.ai_master_enabled', $enabled);
    }
}
