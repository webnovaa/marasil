<?php

declare(strict_types=1);

namespace App\Domain\ApiKeys\Models;

use App\Domain\ApiKeys\Enums\ApiKeyEnvironment;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'name',
        'prefix',
        'secret_hash',
        'secret_encrypted',
        'environment',
        'abilities',
        'last_used_at',
        'last_used_ip',
        'expires_at',
        'revoked_at',
        'revoked_by',
        'revocation_reason',
    ];

    protected $hidden = [
        'secret_hash',
        'secret_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'environment' => ApiKeyEnvironment::class,
            'abilities' => 'array',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
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

    public function isDeviceBound(): bool
    {
        return $this->device_id !== null;
    }

    public function plainTextSecret(): ?string
    {
        if ($this->secret_encrypted === null || $this->secret_encrypted === '') {
            return null;
        }

        try {
            return decrypt($this->secret_encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function isUsable(): bool
    {
        if ($this->revoked_at !== null) {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
