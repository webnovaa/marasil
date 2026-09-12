<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Models;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Enums\MessageStatus;
use App\Domain\Messaging\Enums\MessageType;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'api_key_id',
        'idempotency_key',
        'recipient_e164',
        'type',
        'content_encrypted',
        'media_path',
        'caption',
        'status',
        'provider_message_id',
        'priority',
        'scheduled_at',
        'queued_at',
        'processing_at',
        'sent_at',
        'delivered_at',
        'read_at',
        'failed_at',
        'error_code',
        'error_message',
        'request_id',
    ];

    protected $hidden = [
        'content_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'type' => MessageType::class,
            'status' => MessageStatus::class,
            'content_encrypted' => 'encrypted',
            'priority' => 'integer',
            'scheduled_at' => 'datetime',
            'queued_at' => 'datetime',
            'processing_at' => 'datetime',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'read_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function apiKey(): BelongsTo
    {
        return $this->belongsTo(ApiKey::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(MessageAttempt::class);
    }

    public function statusEvents(): HasMany
    {
        return $this->hasMany(MessageStatusEvent::class);
    }

    /**
     * Plaintext body for inbox/chat UIs (stored encrypted as content_encrypted).
     */
    public function getBodyAttribute(): ?string
    {
        return $this->content_encrypted;
    }
}
