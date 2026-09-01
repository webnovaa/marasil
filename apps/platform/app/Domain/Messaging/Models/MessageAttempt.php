<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttempt extends Model
{
    protected $fillable = [
        'message_id',
        'attempt_number',
        'worker_id',
        'started_at',
        'finished_at',
        'status',
        'error_code',
        'error_class',
        'error_message',
        'next_retry_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'next_retry_at' => 'datetime',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
