<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Actions;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Models\Device;

final class ProvisionDeviceApiKey
{
    public function __construct(
        private readonly CreateApiKey $createApiKey,
        private readonly RotateApiKey $rotateApiKey,
    ) {}

    /**
     * @return array{api_key: ApiKey, plain_text_key: string, created: bool}
     */
    public function ensure(Device $device): array
    {
        $existing = ApiKey::query()
            ->where('device_id', $device->id)
            ->whereNull('revoked_at')
            ->first();

        if ($existing !== null) {
            return [
                'api_key' => $existing,
                'plain_text_key' => '',
                'created' => false,
            ];
        }

        $created = $this->createApiKey->handle($device->tenant, [
            'name' => $device->name,
            'device_id' => $device->id,
        ], deviceBound: true);

        return [
            'api_key' => $created['api_key'],
            'plain_text_key' => $created['plain_text_key'],
            'created' => true,
        ];
    }

    /**
     * @return array{api_key: ApiKey, plain_text_key: string}
     */
    public function rotate(Device $device): array
    {
        $existing = ApiKey::query()
            ->where('device_id', $device->id)
            ->whereNull('revoked_at')
            ->first();

        if ($existing === null) {
            $ensured = $this->ensure($device);

            return [
                'api_key' => $ensured['api_key'],
                'plain_text_key' => $ensured['plain_text_key'],
            ];
        }

        return $this->rotateApiKey->handle($existing);
    }
}
