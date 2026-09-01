<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;

final class DisconnectDevice
{
    public function handle(Device $device): Device
    {
        $from = $device->status->value;

        $device->update([
            'status' => DeviceStatus::Disconnected,
            'last_disconnected_at' => now(),
            'disconnect_reason' => 'user_requested',
        ]);

        DeviceEvent::query()->create([
            'device_id' => $device->id,
            'tenant_id' => $device->tenant_id,
            'event_type' => 'device.disconnect_requested',
            'from_status' => $from,
            'to_status' => DeviceStatus::Disconnected->value,
        ]);

        DispatchDeviceCommand::dispatch($device->ulid, 'disconnect');

        return $device->fresh() ?? $device;
    }
}
