<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;

final class ConnectDevice
{
    public function handle(Device $device): Device
    {
        $from = $device->status->value;

        $device->update([
            'status' => DeviceStatus::Starting,
            'lease_owner' => (string) config('app.name', 'marasil').'-control',
            'lease_generation' => $device->lease_generation + 1,
            'lease_expires_at' => now()->addSeconds(45),
            'last_error_code' => null,
            'last_error_message' => null,
        ]);

        DeviceEvent::query()->create([
            'device_id' => $device->id,
            'tenant_id' => $device->tenant_id,
            'event_type' => 'device.connect_requested',
            'from_status' => $from,
            'to_status' => DeviceStatus::Starting->value,
        ]);

        DispatchDeviceCommand::dispatch($device->ulid, 'create_session');

        return $device->fresh() ?? $device;
    }
}
