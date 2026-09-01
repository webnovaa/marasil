<?php

declare(strict_types=1);

namespace App\Domain\Usage\Models;

use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageLedgerEntry extends Model
{
    protected $table = 'usage_ledger';

    protected $fillable = [
        'tenant_id',
        'message_id',
        'state',
        'quantity',
        'period_type',
        'period_start',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'quantity' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
