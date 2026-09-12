<?php

declare(strict_types=1);

namespace App\Domain\Campaigns\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'name',
        'status',
        'device_ids',
        'message_template',
        'min_delay_seconds',
        'max_delay_seconds',
        'total_recipients',
        'sent_count',
        'failed_count',
        'scheduled_at',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'device_ids' => 'array',
            'min_delay_seconds' => 'integer',
            'max_delay_seconds' => 'integer',
            'total_recipients' => 'integer',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class);
    }
}
