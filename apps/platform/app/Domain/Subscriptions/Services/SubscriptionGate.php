<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Services;

use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Models\Tenant;
use Carbon\CarbonInterface;

final class SubscriptionGate
{
    public function forTenant(?Tenant $tenant, ?CarbonInterface $at = null): bool
    {
        if ($tenant === null) {
            return false;
        }

        $subscription = $this->currentSubscription($tenant, $at);

        return $this->isUsable($subscription, $at);
    }

    public function canMutate(?Subscription $subscription, ?CarbonInterface $at = null): bool
    {
        if (! $this->isUsable($subscription, $at)) {
            return false;
        }

        return $subscription !== null
            && $subscription->status !== SubscriptionStatus::PastDue;
    }

    public function canSend(?Tenant $tenant, ?CarbonInterface $at = null): bool
    {
        if ($tenant === null) {
            return false;
        }

        return $this->canMutate($this->currentSubscription($tenant, $at), $at);
    }

    public function isUsable(?Subscription $subscription, ?CarbonInterface $at = null): bool
    {
        if ($subscription === null) {
            return false;
        }

        $now = $at ?? now();

        if (in_array($subscription->status, [
            SubscriptionStatus::Suspended,
            SubscriptionStatus::Scheduled,
            SubscriptionStatus::Pending,
        ], true)) {
            return false;
        }

        if ($subscription->starts_at !== null && $now->lt($subscription->starts_at)) {
            return false;
        }

        if ($subscription->grace_ends_at !== null && $now->lte($subscription->grace_ends_at)) {
            return true;
        }

        if ($subscription->ends_at !== null && $now->lte($subscription->ends_at)) {
            return in_array($subscription->status, [
                SubscriptionStatus::Active,
                SubscriptionStatus::Trialing,
                SubscriptionStatus::Expiring,
                SubscriptionStatus::GracePeriod,
                SubscriptionStatus::PastDue,
                SubscriptionStatus::Cancelled,
            ], true);
        }

        return false;
    }

    public function currentSubscription(?Tenant $tenant, ?CarbonInterface $at = null): ?Subscription
    {
        if ($tenant === null) {
            return null;
        }

        $now = $at ?? now();

        return Subscription::query()
            ->where('tenant_id', $tenant->id)
            ->where('starts_at', '<=', $now)
            ->where(function ($query) use ($now): void {
                $query->where('ends_at', '>=', $now)
                    ->orWhere('grace_ends_at', '>=', $now);
            })
            ->whereNotIn('status', [
                SubscriptionStatus::Suspended->value,
                SubscriptionStatus::Scheduled->value,
                SubscriptionStatus::Pending->value,
            ])
            ->orderByDesc('starts_at')
            ->first();
    }
}
