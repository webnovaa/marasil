<?php

declare(strict_types=1);

namespace App\Domain\AutoReplies\Models;

use App\Domain\Devices\Models\Device;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutoReply extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'name',
        'trigger_type',
        'trigger_keyword',
        'reply_text',
        'is_active',
        'reply_count',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'reply_count' => 'integer',
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

    public function matches(string $incomingText): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $text = mb_strtolower(trim($incomingText));
        $keyword = mb_strtolower(trim((string) $this->trigger_keyword));

        return match ($this->trigger_type) {
            'exact' => $text === $keyword,
            'contains' => str_contains($text, $keyword),
            'starts_with' => str_starts_with($text, $keyword),
            'welcome' => true,
            default => false,
        };
    }
}
