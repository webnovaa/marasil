<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Subscriptions\Models\Subscription;

final class AdminSubscriptionResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Subscription $subscription): array
    {
        $subscription->loadMissing(['plan', 'tenant.owner.profile']);

        $base = SubscriptionResource::make($subscription);

        return array_merge($base, [
            'tenant' => $subscription->tenant ? [
                'id' => $subscription->tenant->ulid,
                'name' => $subscription->tenant->name,
                'slug' => $subscription->tenant->slug,
                'status' => $subscription->tenant->status->value,
            ] : null,
            'suspended_at' => $subscription->suspended_at?->toIso8601String(),
            'suspension_reason' => $subscription->suspension_reason,
            'created_at' => $subscription->created_at?->toIso8601String(),
        ]);
    }
}
