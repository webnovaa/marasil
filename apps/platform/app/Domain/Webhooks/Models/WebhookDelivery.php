<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Webhooks\Enums\WebhookDeliveryStatus;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'webhook_endpoint_id',
        'event_id',
        'event_type',
        'payload',
        'status',
        'attempt_count',
        'next_attempt_at',
        'response_status',
        'response_excerpt',
        'duration_ms',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'status' => WebhookDeliveryStatus::class,
            'attempt_count' => 'integer',
            'next_attempt_at' => 'datetime',
            'response_status' => 'integer',
            'duration_ms' => 'integer',
            'delivered_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function endpoint(): BelongsTo
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }
}
