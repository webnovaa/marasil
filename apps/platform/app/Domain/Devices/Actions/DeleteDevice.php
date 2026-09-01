<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\ApiKeys\Actions\RevokeApiKey;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Jobs\DispatchDeviceCommand;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;

final class DeleteDevice
{
    public function __construct(
        private readonly RevokeApiKey $revokeApiKey,
    ) {}

    public function handle(Device $device): Device
    {
        $from = $device->status->value;

        $device->loadMissing('apiKey');
        if ($device->apiKey !== null) {
            $this->revokeApiKey->handle($device->apiKey, null, 'device_deleted');
        }

        DispatchDeviceCommand::dispatch($device->ulid, 'delete_session');

        $device->update([
            'status' => DeviceStatus::Deleted,
        ]);

        DeviceEvent::query()->create([
            'device_id' => $device->id,
            'tenant_id' => $device->tenant_id,
            'event_type' => 'device.deleted',
            'from_status' => $from,
            'to_status' => DeviceStatus::Deleted->value,
        ]);

        $device->delete();

        return $device;
    }
}
