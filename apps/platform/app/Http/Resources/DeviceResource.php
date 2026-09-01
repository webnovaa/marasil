<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Devices\Models\Device;

final class DeviceResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Device $device): array
    {
        $payload = [
            'id' => $device->ulid,
            'name' => $device->name,
            'phone_e164' => $device->phone_e164,
            'provider' => $device->provider,
            'status' => $device->status->value,
            'worker_id' => $device->worker_id,
            'session_version' => $device->session_version,
            'last_connected_at' => $device->last_connected_at?->toIso8601String(),
            'last_disconnected_at' => $device->last_disconnected_at?->toIso8601String(),
            'last_heartbeat_at' => $device->last_heartbeat_at?->toIso8601String(),
            'disconnect_reason' => $device->disconnect_reason,
            'last_error_code' => $device->last_error_code,
            'settings' => $device->settings ?? [],
            'created_at' => $device->created_at?->toIso8601String(),
            'updated_at' => $device->updated_at?->toIso8601String(),
        ];

        if ($device->relationLoaded('apiKey') && $device->apiKey !== null) {
            $payload['api_key_prefix'] = $device->apiKey->prefix;
        }

        return $payload;
    }

    /**
     * @param  iterable<Device>  $devices
     * @return list<array<string, mixed>>
     */
    public static function collection(iterable $devices): array
    {
        $items = [];

        foreach ($devices as $device) {
            $items[] = self::make($device);
        }

        return $items;
    }
}
