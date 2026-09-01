<?php

declare(strict_types=1);

namespace App\Domain\Templates\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateVersion extends Model
{
    protected $fillable = [
        'message_template_id',
        'version',
        'body',
        'variables',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'variables' => 'array',
            'is_current' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'message_template_id');
    }
}
