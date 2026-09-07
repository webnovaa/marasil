<?php

declare(strict_types=1);

namespace App\Domain\Platform\Services;

use App\Domain\Devices\Actions\ConnectDevice;
use App\Domain\Devices\Actions\DeleteDevice;
use App\Domain\Devices\Actions\DisconnectDevice;
use App\Domain\Devices\Actions\LogoutDevice;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Devices\Models\DeviceSession;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class PlatformWhatsAppService
{
    public function __construct(
        private readonly PlatformTenantService $platformTenant,
        private readonly WhatsAppServiceClient $whatsAppClient,
        private readonly ConnectDevice $connectDevice,
        private readonly DisconnectDevice $disconnectDevice,
        private readonly LogoutDevice $logoutDevice,
        private readonly DeleteDevice $deleteDevice,
    ) {}

    public function device(): ?Device
    {
        return Device::query()
            ->where('is_platform', true)
            ->with(['tenant', 'session'])
            ->first();
    }

    public function getOrCreateDevice(): Device
    {
        $existing = $this->device();

        if ($existing !== null) {
            return $existing;
        }

        $tenant = $this->platformTenant->tenant();

        return DB::transaction(function () use ($tenant): Device {
            $device = Device::query()->create([
                'tenant_id' => $tenant->id,
                'is_platform' => true,
                'name' => (string) config('platform.device_name', 'Official WhatsApp Account'),
                'display_name' => (string) config('platform.device_display_name', 'Marasil'),
                'provider' => 'baileys',
                'status' => DeviceStatus::Pending,
                'settings' => ['purpose' => 'platform_otp_and_notifications'],
            ]);

            DeviceSession::query()->create(['device_id' => $device->id]);

            DeviceEvent::query()->create([
                'device_id' => $device->id,
                'tenant_id' => $tenant->id,
                'event_type' => 'platform.device.created',
                'from_status' => null,
                'to_status' => DeviceStatus::Pending->value,
            ]);

            return $device->fresh(['tenant', 'session']) ?? $device;
        });
    }

    public function isReady(): bool
    {
        $device = $this->device();

        return $device !== null && $device->isConnected();
    }

    /**
     * @return array{status: string|null, pairing: array{qr: string, expires_in: int}|null}
     */
    public function engineSnapshot(?Device $device = null): array
    {
        $device ??= $this->device();
        if ($device === null) {
            return ['status' => null, 'pairing' => null];
        }

        try {
            $result = $this->whatsAppClient->deviceHealth($device->ulid);
            $data = is_array($result['data'] ?? null) ? $result['data'] : [];
            $pairing = $data['pairing'] ?? null;
            $qr = is_array($pairing) && isset($pairing['qr']) && is_string($pairing['qr']) ? $pairing['qr'] : '';

            return [
                'status' => isset($data['status']) ? (string) $data['status'] : null,
                'pairing' => $qr !== '' ? [
                    'qr' => $qr,
                    'expires_in' => max(1, (int) ($pairing['expires_in'] ?? 20)),
                ] : null,
            ];
        } catch (Throwable) {
            return ['status' => null, 'pairing' => null];
        }
    }

    public function connect(): Device
    {
        return $this->connectDevice->handle($this->getOrCreateDevice());
    }

    public function disconnect(): Device
    {
        $device = $this->device();
        if ($device === null) {
            throw new RuntimeException('Platform WhatsApp device is not configured.');
        }

        return $this->disconnectDevice->handle($device);
    }

    public function logout(): Device
    {
        $device = $this->device();
        if ($device === null) {
            throw new RuntimeException('Platform WhatsApp device is not configured.');
        }

        return $this->logoutDevice->handle($device);
    }

    public function deleteAccount(): void
    {
        $device = $this->device();
        if ($device === null) {
            throw new RuntimeException('Platform WhatsApp device is not configured.');
        }

        $this->deleteDevice->handle($device);
    }

    /**
     * Send an OTP message from the platform-owned WhatsApp account.
     */
    public function sendOtpMessage(string $recipientE164, string $text): void
    {
        $device = $this->device();

        if ($device === null || ! $device->isConnected()) {
            throw new RuntimeException('Platform WhatsApp device is not connected.');
        }

        $messageId = 'plt_'.Str::lower((string) Str::ulid());

        $this->whatsAppClient->sendMessage([
            'command_id' => 'platform_'.$messageId,
            'message_id' => $messageId,
            'device_id' => $device->ulid,
            'tenant_id' => $device->tenant?->ulid,
            'lease_generation' => $device->lease_generation,
            'recipient' => $recipientE164,
            'text' => $text,
        ]);
    }

    /**
     * @param  array{display_name?: string|null, avatar_path?: string|null}  $data
     */
    public function updateProfile(array $data): Device
    {
        $device = $this->getOrCreateDevice();
        $device->fill(array_filter($data, fn ($v) => $v !== null));
        $device->save();

        return $device->fresh(['tenant', 'session']) ?? $device;
    }
}
