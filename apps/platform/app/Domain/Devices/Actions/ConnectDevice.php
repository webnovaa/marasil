<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use Illuminate\Support\Facades\DB;

final class ConnectDevice
{
    public function handle(Device $device): Device
    {
        [$device, $shouldDispatch] = DB::transaction(function () use ($device): array {
            $locked = Device::query()->lockForUpdate()->findOrFail($device->id);
            $pairingStatuses = [
                DeviceStatus::Starting,
                DeviceStatus::WaitingForQr,
                DeviceStatus::Pairing,
                DeviceStatus::Connecting,
                DeviceStatus::Reconnecting,
            ];

            if (in_array($locked->status, $pairingStatuses, true)
                && $locked->lease_expires_at?->isFuture()) {
                return [$locked, false];
            }

            $from = $locked->status->value;
            $locked->update([
                'status' => DeviceStatus::Starting,
                'lease_owner' => (string) config('app.name', 'marasil').'-control',
                'lease_generation' => $locked->lease_generation + 1,
                'lease_expires_at' => now()->addSeconds(15),
                'last_error_code' => null,
                'last_error_message' => null,
            ]);

            DeviceEvent::query()->create([
                'device_id' => $locked->id,
                'tenant_id' => $locked->tenant_id,
                'event_type' => 'device.connect_requested',
                'from_status' => $from,
                'to_status' => DeviceStatus::Starting->value,
            ]);

            return [$locked, true];
        });

        if ($shouldDispatch) {
            DispatchDeviceCommand::dispatch($device->ulid, 'create_session', $device->lease_generation);
        }

        return $device->fresh() ?? $device;
    }
}
