<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use Illuminate\Support\Facades\DB;
use Throwable;

final class ConnectDevice
{
    public function __construct(
        private readonly WhatsAppServiceClient $whatsAppClient,
    ) {}

    public function handle(Device $device): Device
    {
        $liveConnected = $device->status === DeviceStatus::Connected && $this->isLiveConnected($device);

        [$device, $shouldDispatch] = DB::transaction(function () use ($device, $liveConnected): array {
            $locked = Device::query()->lockForUpdate()->findOrFail($device->id);
            if ($locked->status === DeviceStatus::Connected && $liveConnected) {
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

    private function isLiveConnected(Device $device): bool
    {
        try {
            $result = $this->whatsAppClient->deviceHealth($device->ulid);

            return ($result['data']['status'] ?? null) === 'connected';
        } catch (Throwable) {
            return false;
        }
    }
}
