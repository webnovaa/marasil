<?php

declare(strict_types=1);

namespace App\Domain\Plans\Actions;

use App\Domain\Plans\Models\Plan;
use Illuminate\Support\Str;

final class CreatePlan
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Plan
    {
        $slug = $data['slug'] ?? Str::slug((string) $data['name']);

        return Plan::query()->create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'price_minor' => (int) ($data['price_minor'] ?? 0),
            'annual_discount_percent' => isset($data['annual_discount_percent']) && $data['annual_discount_percent'] !== null ? (int) $data['annual_discount_percent'] : null,
            'currency' => $data['currency'] ?? 'USD',
            'duration_days' => (int) ($data['duration_days'] ?? 30),
            'max_devices' => (int) ($data['max_devices'] ?? 1),
            'monthly_message_limit' => (int) ($data['monthly_message_limit'] ?? 100),
            'daily_message_limit_per_device' => (int) ($data['daily_message_limit_per_device'] ?? 20),
            // Keys are 1:1 with devices; keep column for subscription snapshots.
            'max_api_keys' => (int) ($data['max_devices'] ?? $data['max_api_keys'] ?? 1),
            'max_webhooks' => (int) ($data['max_webhooks'] ?? 1),
            'max_media_size_mb' => (int) ($data['max_media_size_mb'] ?? 8),
            'allow_media' => (bool) ($data['allow_media'] ?? false),
            'allow_priority_queue' => (bool) ($data['allow_priority_queue'] ?? false),
            'allow_team_members' => (bool) ($data['allow_team_members'] ?? false),
            'features' => $data['features'] ?? [],
            'is_public' => (bool) ($data['is_public'] ?? true),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 100),
        ]);
    }
}
