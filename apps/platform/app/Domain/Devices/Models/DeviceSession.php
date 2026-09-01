<?php

declare(strict_types=1);

namespace App\Domain\Devices\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceSession extends Model
{
    protected $fillable = [
        'device_id',
        'encrypted_data',
        'encrypted_data_key',
        'encryption_key_version',
        'nonce',
        'auth_tag',
        'credentials_version',
        'rotated_at',
    ];

    protected $hidden = [
        'encrypted_data',
        'encrypted_data_key',
        'nonce',
        'auth_tag',
    ];

    protected function casts(): array
    {
        return [
            'encrypted_data' => 'encrypted',
            'encrypted_data_key' => 'encrypted',
            'encryption_key_version' => 'integer',
            'credentials_version' => 'integer',
            'rotated_at' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
