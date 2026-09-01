<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Policies;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Models\SubscriptionRequest;

final class SubscriptionRequestPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->hasPermission('subscriptions.view') || $actor->isPlatformAdmin();
    }

    public function approve(User $actor, SubscriptionRequest $request): bool
    {
        return $actor->hasPermission('subscriptions.approve') || $actor->isPlatformAdmin();
    }

    public function reject(User $actor, SubscriptionRequest $request): bool
    {
        return $actor->hasPermission('subscriptions.approve') || $actor->isPlatformAdmin();
    }
}
