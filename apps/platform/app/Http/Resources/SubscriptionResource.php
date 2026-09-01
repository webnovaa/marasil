<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Services\SubscriptionGate;

final class SubscriptionResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Subscription $subscription): array
    {
        $usable = app(SubscriptionGate::class)->isUsable($subscription);

        return [
            'id' => $subscription->ulid,
            'status' => $subscription->status->value,
            'is_usable' => $usable,
            'starts_at' => $subscription->starts_at?->toIso8601String(),
            'ends_at' => $subscription->ends_at?->toIso8601String(),
            'grace_ends_at' => $subscription->grace_ends_at?->toIso8601String(),
            'plan_name' => $subscription->plan_name,
            'plan_slug' => $subscription->plan_slug,
            'price_minor' => $subscription->price_minor,
            'currency' => $subscription->currency,
            'duration_days' => $subscription->duration_days,
            'max_devices' => $subscription->max_devices,
            'monthly_message_limit' => $subscription->monthly_message_limit,
            'daily_message_limit_per_device' => $subscription->daily_message_limit_per_device,
            'max_api_keys' => $subscription->max_api_keys,
            'max_webhooks' => $subscription->max_webhooks,
            'max_media_size_mb' => $subscription->max_media_size_mb,
            'allow_media' => $subscription->allow_media,
            'allow_priority_queue' => $subscription->allow_priority_queue,
            'allow_team_members' => $subscription->allow_team_members,
            'features' => $subscription->features ?? [],
            'auto_renew' => $subscription->auto_renew,
            'plan' => $subscription->relationLoaded('plan') && $subscription->plan
                ? PlanResource::make($subscription->plan)
                : null,
        ];
    }
}
