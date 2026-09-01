<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Models\DeviceSession;

final class LogoutDevice
{
    public function handle(Device $device): Device
    {
        $from = $device->status->value;

        $device->update([
            'status' => DeviceStatus::LoggedOut,
            'last_disconnected_at' => now(),
            'disconnect_reason' => 'logout',
            'phone_e164' => null,
            'session_version' => $device->session_version + 1,
        ]);

        DeviceSession::query()
            ->where('device_id', $device->id)
            ->update([
                'encrypted_data' => null,
                'encrypted_data_key' => null,
                'nonce' => null,
                'auth_tag' => null,
                'credentials_version' => 0,
                'rotated_at' => now(),
            ]);

        DeviceEvent::query()->create([
            'device_id' => $device->id,
            'tenant_id' => $device->tenant_id,
            'event_type' => 'device.logout_requested',
            'from_status' => $from,
            'to_status' => DeviceStatus::LoggedOut->value,
        ]);

        DispatchDeviceCommand::dispatch($device->ulid, 'logout');

        return $device->fresh() ?? $device;
    }
}
