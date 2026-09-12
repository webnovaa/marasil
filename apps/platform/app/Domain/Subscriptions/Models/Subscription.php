<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Models;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'grace_ends_at',
        'plan_name',
        'plan_slug',
        'price_minor',
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
        'approved_by',
        'suspended_at',
        'suspension_reason',
        'auto_renew',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'grace_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
            'price_minor' => 'integer',
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
            'auto_renew' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? [], true);
    }
}
