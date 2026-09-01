<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\ApiKeys\Actions\ProvisionDeviceApiKey;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Models\DeviceSession;
use App\Domain\Subscriptions\Services\PlanLimitGuard;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;

final class CreateDevice
{
    public function __construct(
        private readonly PlanLimitGuard $planLimitGuard,
        private readonly ProvisionDeviceApiKey $provisionDeviceApiKey,
    ) {}

    /**
     * @param  array{name: string, settings?: array<string, mixed>|null}  $data
     * @return array{device: Device, integration_key?: string}
     */
    public function handle(Tenant $tenant, array $data): array
    {
        $this->planLimitGuard->assertCanCreateDevice($tenant);

        $device = DB::transaction(function () use ($tenant, $data): Device {
            $device = Device::query()->create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'provider' => 'baileys',
                'status' => DeviceStatus::Pending,
                'settings' => $data['settings'] ?? [],
            ]);

            DeviceSession::query()->create([
                'device_id' => $device->id,
            ]);

            DeviceEvent::query()->create([
                'device_id' => $device->id,
                'tenant_id' => $tenant->id,
                'event_type' => 'device.created',
                'from_status' => null,
                'to_status' => DeviceStatus::Pending->value,
            ]);

            return $device->fresh() ?? $device;
        });

        $provisioned = $this->provisionDeviceApiKey->ensure($device);

        return [
            'device' => $device,
            'integration_key' => $provisioned['plain_text_key'] !== '' ? $provisioned['plain_text_key'] : null,
        ];
    }
}
