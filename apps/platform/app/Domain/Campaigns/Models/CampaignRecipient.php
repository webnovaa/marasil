<?php

declare(strict_types=1);

namespace App\Domain\Campaigns\Models;

use App\Domain\Devices\Models\Device;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignRecipient extends Model
{
    use HasUlid;

    protected $fillable = [
        'campaign_id',
        'phone_e164',
        'recipient_name',
        'status',
        'device_id',
        'error_message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
