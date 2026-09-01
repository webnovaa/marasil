<?php

declare(strict_types=1);

namespace App\Domain\Consent\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuppressionEntry extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'recipient_e164',
        'reason',
        'suppressed_until',
    ];

    protected function casts(): array
    {
        return [
            'suppressed_until' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
