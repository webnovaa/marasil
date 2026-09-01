<?php

declare(strict_types=1);

namespace App\Domain\Plans\Policies;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;

final class PlanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('plans.manage');
    }

    public function view(User $user, Plan $plan): bool
    {
        return $user->hasPermission('plans.manage');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('plans.manage');
    }

    public function update(User $user, Plan $plan): bool
    {
        return $user->hasPermission('plans.manage');
    }

    public function delete(User $user, Plan $plan): bool
    {
        return $user->hasPermission('plans.manage');
    }
}
