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
        // Plaintext key is returned ONLY when freshly created/rotated — never re-decrypted from storage.
        $sendUrl = url('/api/v1/messages/send');
        $checkUrl = url('/api/v1/numbers/check');

        $payload = [
            'send_url' => $sendUrl,
            'check_url' => $checkUrl,
            'username' => $tenant->slug,
            'device_name' => $device->name,
            'device_id' => $device->ulid,
            'api_key_prefix' => $apiKey?->prefix,
            'has_api_key' => $apiKey !== null && $apiKey->isUsable(),
            'api_key_revealed' => $plainTextKey !== null && $plainTextKey !== '',
            'usage' => [
                'authorization' => 'Authorization: Bearer {api_key}',
                'send_text' => 'POST /api/v1/messages/send',
                'note' => 'You can send messages using Send URL + Device Name + Username directly.',
            ],
        ];

        if ($plainTextKey !== null && $plainTextKey !== '') {
            $payload['api_key'] = $plainTextKey;
        }

        return $payload;
    }
}
