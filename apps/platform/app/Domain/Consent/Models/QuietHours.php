<?php

declare(strict_types=1);

namespace App\Domain\Consent\Models;

use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuietHours extends Model
{
    protected $fillable = [
        'tenant_id',
        'enabled',
        'starts_at',
        'ends_at',
        'timezone',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
