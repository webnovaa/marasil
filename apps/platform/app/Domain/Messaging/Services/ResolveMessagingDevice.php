<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Services;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;

final class ResolveMessagingDevice
{
    /**
     * @param  array{device_id?: string|null}  $data
     */
    public function resolve(Tenant $tenant, array &$data, ?ApiKey $apiKey = null): Device
    {
        if ($apiKey?->device_id !== null) {
            $device = Device::query()
                ->where('tenant_id', $tenant->id)
                ->whereKey($apiKey->device_id)
                ->first();

            if ($device === null) {
                throw new HttpResponseException(
                    ApiResponse::error('DEVICE_NOT_FOUND', 'Bound device not found.', 404)
                );
            }

            if (
                isset($data['device_id'])
                && is_string($data['device_id'])
                && $data['device_id'] !== ''
                && $data['device_id'] !== $device->ulid
            ) {
                throw new HttpResponseException(
                    ApiResponse::error('DEVICE_KEY_MISMATCH', 'This API key is bound to a different device.', 403)
                );
            }

            $data['device_id'] = $device->ulid;
        }

        if (! isset($data['device_id']) || ! is_string($data['device_id']) || $data['device_id'] === '') {
            throw new HttpResponseException(
                ApiResponse::error('DEVICE_ID_REQUIRED', 'device_id is required for this API key.', 422)
            );
        }

        $device = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('ulid', $data['device_id'])
            ->first();

        if ($device === null) {
            throw new HttpResponseException(
                ApiResponse::error('DEVICE_NOT_FOUND', 'Device not found.', 404)
            );
        }

        if ($device->status !== DeviceStatus::Connected) {
            throw new HttpResponseException(
                ApiResponse::error('DEVICE_NOT_CONNECTED', 'Device is not connected.', 422)
            );
        }

        return $device;
    }
}
