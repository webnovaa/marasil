<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Policies;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Identity\Models\User;

final class ApiKeyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function create(User $user): bool
    {
        return $user->primaryTenant() !== null || $user->isPlatformAdmin();
    }

    public function delete(User $user, ApiKey $apiKey): bool
    {
        return $this->owns($user, $apiKey);
    }

    public function rotate(User $user, ApiKey $apiKey): bool
    {
        return $this->owns($user, $apiKey);
    }

    private function owns(User $user, ApiKey $apiKey): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        $tenant = $user->primaryTenant();

        return $tenant !== null && (int) $tenant->id === (int) $apiKey->tenant_id;
    }
}
