<?php

declare(strict_types=1);

namespace App\Domain\Devices\Policies;

use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Models\User;

final class DevicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function view(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    public function create(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function update(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    public function delete(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    public function connect(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    public function disconnect(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    public function logout(User $user, Device $device): bool
    {
        return $this->ownsTenantDevice($user, $device);
    }

    private function ownsTenantDevice(User $user, Device $device): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        $tenant = $user->primaryTenant();

        return $tenant !== null && (int) $tenant->id === (int) $device->tenant_id;
    }
}
