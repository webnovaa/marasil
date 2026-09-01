<?php

declare(strict_types=1);

namespace App\Domain\Identity\Policies;

use App\Domain\Identity\Models\User;

final class UserPolicy
{
    public function viewPending(User $actor): bool
    {
        return $actor->hasPermission('users.view');
    }

    public function approve(User $actor, User $target): bool
    {
        return $actor->hasPermission('users.approve');
    }

    public function reject(User $actor, User $target): bool
    {
        return $actor->hasPermission('users.approve');
    }

    public function suspend(User $actor, User $target): bool
    {
        return $actor->hasPermission('users.suspend');
    }
}
