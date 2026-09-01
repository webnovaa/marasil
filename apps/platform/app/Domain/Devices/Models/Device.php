<?php

declare(strict_types=1);

namespace App\Domain\Devices\Models;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use HasUlid;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'created_by',
        'name',
        'phone_e164',
        'display_name',
        'provider',
        'status',
        'worker_id',
        'lease_owner',
        'lease_generation',
        'lease_expires_at',
        'session_version',
        'last_connected_at',
        'last_disconnected_at',
        'last_heartbeat_at',
        'disconnect_reason',
        'last_error_code',
        'last_error_message',
        'last_error_at',
        'daily_limit_override',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeviceStatus::class,
            'session_version' => 'integer',
            'lease_generation' => 'integer',
            'lease_expires_at' => 'datetime',
            'last_connected_at' => 'datetime',
            'last_disconnected_at' => 'datetime',
            'last_heartbeat_at' => 'datetime',
            'last_error_at' => 'datetime',
            'daily_limit_override' => 'integer',
            'settings' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function session(): HasOne
    {
        return $this->hasOne(DeviceSession::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(DeviceEvent::class);
    }

    public function apiKey(): HasOne
    {
        return $this->hasOne(ApiKey::class)->whereNull('revoked_at');
    }

    public function isConnected(): bool
    {
        return $this->status === DeviceStatus::Connected;
    }
}
