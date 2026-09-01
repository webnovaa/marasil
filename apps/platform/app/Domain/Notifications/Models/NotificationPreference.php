<?php

declare(strict_types=1);

namespace App\Domain\Notifications\Models;

use App\Domain\Identity\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'in_app_enabled',
        'security_critical_enabled',
        'usage_alerts_enabled',
        'device_alerts_enabled',
    ];

    protected function casts(): array
    {
        return [
            'in_app_enabled' => 'boolean',
            'security_critical_enabled' => 'boolean',
            'usage_alerts_enabled' => 'boolean',
            'device_alerts_enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
