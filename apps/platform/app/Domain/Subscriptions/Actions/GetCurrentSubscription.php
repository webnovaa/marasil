<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Actions;

use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;

final class GetCurrentSubscription
{
    public function __construct(
        private readonly SubscriptionGate $gate,
    ) {}

    public function handle(?Tenant $tenant): ?Subscription
    {
        return $this->gate->currentSubscription($tenant);
    }
}
