<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\ApiKeys\Models\ApiKey;

final class ApiKeyResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(ApiKey $apiKey, ?string $plainTextKey = null): array
    {
        $payload = [
            'id' => $apiKey->ulid,
            'name' => $apiKey->name,
            'prefix' => $apiKey->prefix,
            'device_bound' => $apiKey->isDeviceBound(),
            'device_id' => $apiKey->device?->ulid,
            'device_name' => $apiKey->device?->name,
            'environment' => $apiKey->environment->value,
            'abilities' => $apiKey->abilities ?? [],
            'last_used_at' => $apiKey->last_used_at?->toIso8601String(),
            'expires_at' => $apiKey->expires_at?->toIso8601String(),
            'revoked_at' => $apiKey->revoked_at?->toIso8601String(),
            'created_at' => $apiKey->created_at?->toIso8601String(),
            'can_reveal' => false,
        ];

        if ($plainTextKey !== null && $plainTextKey !== '') {
            $payload['secret'] = $plainTextKey;
            $payload['key'] = $plainTextKey;
            $payload['api_key'] = $plainTextKey;
            $payload['can_reveal'] = true;
        }

        return $payload;
    }

    /**
     * @param  iterable<ApiKey>  $keys
     * @return list<array<string, mixed>>
     */
    public static function collection(iterable $keys): array
    {
        $items = [];

        foreach ($keys as $key) {
            $items[] = self::make($key);
        }

        return $items;
    }
}
