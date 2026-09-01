<?php

declare(strict_types=1);

namespace App\Domain\Usage\Models;

use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageCounter extends Model
{
    protected $fillable = [
        'tenant_id',
        'device_id',
        'period_type',
        'period_start',
        'messages_accepted',
        'messages_sent',
        'messages_failed',
        'media_bytes',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'messages_accepted' => 'integer',
            'messages_sent' => 'integer',
            'messages_failed' => 'integer',
            'media_bytes' => 'integer',
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
