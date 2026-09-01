<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;

final class DeviceIntegrationResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Device $device, Tenant $tenant, ?ApiKey $apiKey, ?string $plainTextKey = null): array
    {
        $visibleKey = $plainTextKey ?: $apiKey?->plainTextSecret();

        $payload = [
            'username' => $tenant->slug,
            'device_name' => $device->name,
            'device_id' => $device->ulid,
            'api_key_prefix' => $apiKey?->prefix,
            'has_api_key' => $apiKey !== null && $apiKey->isUsable(),
            'usage' => [
                'authorization' => 'Authorization: Bearer {api_key}',
                'send_text' => 'POST /api/v1/messages/text',
                'note' => 'Device-bound keys do not require device_id in the request body.',
            ],
        ];

        if ($visibleKey !== null && $visibleKey !== '') {
            $payload['api_key'] = $visibleKey;
        }

        return $payload;
    }
}
