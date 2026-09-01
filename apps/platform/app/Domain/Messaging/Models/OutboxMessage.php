<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Models;

use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;

class OutboxMessage extends Model
{
    use HasUlid;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'aggregate_type',
        'aggregate_id',
        'event_type',
        'payload',
        'status',
        'attempts',
        'available_at',
        'published_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'available_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }
}
