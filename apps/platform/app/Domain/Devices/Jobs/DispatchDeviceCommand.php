<?php

declare(strict_types=1);

namespace App\Domain\Devices\Jobs;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DispatchDeviceCommand implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $deviceUlid,
        public readonly string $command,
    ) {}

    public function handle(WhatsAppServiceClient $client): void
    {
        $device = Device::query()->where('ulid', $this->deviceUlid)->first();

        if ($device === null) {
            return;
        }

        try {
            match ($this->command) {
                'create_session' => $client->createSession($device->ulid, [
                    'tenant_id' => $device->tenant?->ulid,
                    'lease_generation' => $device->lease_generation,
                ]),
                'disconnect' => $client->disconnect($device->ulid),
                'logout' => $client->logout($device->ulid),
                'delete_session' => $client->deleteSession($device->ulid),
                default => null,
            };

        } catch (Throwable $e) {
            Log::warning('DispatchDeviceCommand failed', [
                'device_ulid' => $this->deviceUlid,
                'command' => $this->command,
                'error' => $e->getMessage(),
            ]);

            $device->update([
                'status' => DeviceStatus::Error,
                'last_error_code' => 'PROVIDER_TEMPORARILY_UNAVAILABLE',
                'last_error_message' => 'WhatsApp service command failed.',
            ]);
        }
    }
}
