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
        ];

        $visibleKey = $plainTextKey ?? $apiKey->plainTextSecret();

        if ($visibleKey !== null && $visibleKey !== '') {
            $payload['secret'] = $visibleKey;
            $payload['key'] = $visibleKey;
            $payload['api_key'] = $visibleKey;
        } elseif ($plainTextKey !== null) {
            $payload['secret'] = $plainTextKey;
            $payload['key'] = $plainTextKey;
            $payload['api_key'] = $plainTextKey;
        }

        $payload['can_reveal'] = ($visibleKey !== null && $visibleKey !== '') || $plainTextKey !== null;

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
