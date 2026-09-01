<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebhookEndpoint extends Model
{
    use HasUlid;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'url',
        'secret_hash',
        'secret_encrypted',
        'subscribed_events',
        'status',
        'last_success_at',
        'last_failure_at',
        'failure_count',
    ];

    protected $hidden = [
        'secret_hash',
        'secret_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_events' => 'array',
            'status' => WebhookEndpointStatus::class,
            'secret_encrypted' => 'encrypted',
            'last_success_at' => 'datetime',
            'last_failure_at' => 'datetime',
            'failure_count' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    public function isActive(): bool
    {
        return $this->status === WebhookEndpointStatus::Active
            || $this->status === WebhookEndpointStatus::Failing;
    }

    /**
     * @param  list<string>|string  $eventType
     */
    public function subscribesTo(string $eventType): bool
    {
        $events = $this->subscribed_events ?? [];

        return in_array($eventType, $events, true) || in_array('*', $events, true);
    }
}
