<?php

declare(strict_types=1);

namespace App\Domain\Plans\Actions;

use App\Domain\Plans\Models\Plan;

final class UpdatePlan
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Plan $plan, array $data): Plan
    {
        $plan->fill([
            'name' => $data['name'] ?? $plan->name,
            'slug' => $data['slug'] ?? $plan->slug,
            'description' => array_key_exists('description', $data) ? $data['description'] : $plan->description,
            'price_minor' => array_key_exists('price_minor', $data) ? (int) $data['price_minor'] : $plan->price_minor,
            'annual_discount_percent' => array_key_exists('annual_discount_percent', $data) ? ($data['annual_discount_percent'] === null ? null : (int) $data['annual_discount_percent']) : $plan->annual_discount_percent,
            'currency' => $data['currency'] ?? $plan->currency,
            'duration_days' => array_key_exists('duration_days', $data) ? (int) $data['duration_days'] : $plan->duration_days,
            'max_devices' => array_key_exists('max_devices', $data) ? (int) $data['max_devices'] : $plan->max_devices,
            'monthly_message_limit' => array_key_exists('monthly_message_limit', $data) ? (int) $data['monthly_message_limit'] : $plan->monthly_message_limit,
            'daily_message_limit_per_device' => array_key_exists('daily_message_limit_per_device', $data) ? (int) $data['daily_message_limit_per_device'] : $plan->daily_message_limit_per_device,
            'max_api_keys' => array_key_exists('max_api_keys', $data) ? (int) $data['max_api_keys'] : $plan->max_api_keys,
            'max_webhooks' => array_key_exists('max_webhooks', $data) ? (int) $data['max_webhooks'] : $plan->max_webhooks,
            'max_media_size_mb' => array_key_exists('max_media_size_mb', $data) ? (int) $data['max_media_size_mb'] : $plan->max_media_size_mb,
            'allow_media' => array_key_exists('allow_media', $data) ? (bool) $data['allow_media'] : $plan->allow_media,
            'allow_priority_queue' => array_key_exists('allow_priority_queue', $data) ? (bool) $data['allow_priority_queue'] : $plan->allow_priority_queue,
            'allow_team_members' => array_key_exists('allow_team_members', $data) ? (bool) $data['allow_team_members'] : $plan->allow_team_members,
            'features' => array_key_exists('features', $data) ? $data['features'] : $plan->features,
            'is_public' => array_key_exists('is_public', $data) ? (bool) $data['is_public'] : $plan->is_public,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $plan->is_active,
            'sort_order' => array_key_exists('sort_order', $data) ? (int) $data['sort_order'] : $plan->sort_order,
        ]);
        $plan->save();

        return $plan->refresh();
    }
}
