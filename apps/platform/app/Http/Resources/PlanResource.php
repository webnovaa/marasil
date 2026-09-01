<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Plans\Models\Plan;

final class PlanResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Plan $plan): array
    {
        return [
            'id' => $plan->ulid,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'description' => $plan->description,
            'price_minor' => $plan->price_minor,
            'annual_discount_percent' => $plan->annual_discount_percent,
            'currency' => $plan->currency,
            'duration_days' => $plan->duration_days,
            'max_devices' => $plan->max_devices,
            'monthly_message_limit' => $plan->monthly_message_limit,
            'daily_message_limit_per_device' => $plan->daily_message_limit_per_device,
            'max_api_keys' => $plan->max_api_keys,
            'max_webhooks' => $plan->max_webhooks,
            'max_media_size_mb' => $plan->max_media_size_mb,
            'allow_media' => $plan->allow_media,
            'allow_priority_queue' => $plan->allow_priority_queue,
            'allow_team_members' => $plan->allow_team_members,
            'features' => $plan->features ?? [],
            'is_public' => $plan->is_public,
            'is_active' => $plan->is_active,
            'sort_order' => $plan->sort_order,
        ];
    }
}
