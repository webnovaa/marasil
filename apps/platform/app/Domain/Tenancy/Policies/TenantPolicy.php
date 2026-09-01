<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Policies;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Tenant;

final class TenantPolicy
{
    public function accessArea(User $user): bool
    {
        return $user->canAccessTenantArea();
    }

    public function view(User $user, Tenant $tenant): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $tenant->members()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }
}
