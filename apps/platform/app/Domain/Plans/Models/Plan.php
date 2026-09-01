<?php

declare(strict_types=1);

namespace App\Domain\Plans\Models;

use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plan extends Model
{
    use HasUlid;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_minor',
        'annual_discount_percent',
        'currency',
        'duration_days',
        'max_devices',
        'monthly_message_limit',
        'daily_message_limit_per_device',
        'max_api_keys',
        'max_webhooks',
        'max_media_size_mb',
        'allow_media',
        'allow_priority_queue',
        'allow_team_members',
        'features',
        'is_public',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'annual_discount_percent' => 'integer',
            'duration_days' => 'integer',
            'max_devices' => 'integer',
            'monthly_message_limit' => 'integer',
            'daily_message_limit_per_device' => 'integer',
            'max_api_keys' => 'integer',
            'max_webhooks' => 'integer',
            'max_media_size_mb' => 'integer',
            'allow_media' => 'boolean',
            'allow_priority_queue' => 'boolean',
            'allow_team_members' => 'boolean',
            'features' => 'array',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function subscriptionRequests(): HasMany
    {
        return $this->hasMany(SubscriptionRequest::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function limitSnapshot(): array
    {
        return [
            'plan_name' => $this->name,
            'plan_slug' => $this->slug,
            'price_minor' => $this->price_minor,
            'annual_discount_percent' => $this->annual_discount_percent,
            'currency' => $this->currency,
            'duration_days' => $this->duration_days,
            'max_devices' => $this->max_devices,
            'monthly_message_limit' => $this->monthly_message_limit,
            'daily_message_limit_per_device' => $this->daily_message_limit_per_device,
            'max_api_keys' => $this->max_api_keys,
            'max_webhooks' => $this->max_webhooks,
            'max_media_size_mb' => $this->max_media_size_mb,
            'allow_media' => $this->allow_media,
            'allow_priority_queue' => $this->allow_priority_queue,
            'allow_team_members' => $this->allow_team_members,
            'features' => $this->features ?? [],
        ];
    }

    public function requiresAdminApproval(): bool
    {
        return $this->price_minor > 0;
    }
}
