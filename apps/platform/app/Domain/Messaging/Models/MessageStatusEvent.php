<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageStatusEvent extends Model
{
    protected $fillable = [
        'message_id',
        'status',
        'provider_timestamp',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'provider_timestamp' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
