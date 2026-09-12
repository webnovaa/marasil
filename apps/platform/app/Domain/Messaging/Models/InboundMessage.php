<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Models;

use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InboundMessage extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'sender_phone_e164',
        'provider_message_id',
        'body',
        'push_name',
        'raw_payload',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'received_at' => 'datetime',
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
}
