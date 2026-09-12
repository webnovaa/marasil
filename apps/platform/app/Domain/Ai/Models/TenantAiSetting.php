<?php

declare(strict_types=1);

namespace App\Domain\Ai\Models;

use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantAiSetting extends Model
{
    protected $fillable = [
        'tenant_id',
        'gemini_api_key',
        'model',
        'company_name',
        'company_bio',
        'products_services',
        'working_hours',
        'policies',
        'system_instruction',
        'tone',
        'is_enabled',
        'temperature',
        'max_tokens',
        'total_ai_replies',
    ];

    protected function casts(): array
    {
        return [
            'gemini_api_key' => 'encrypted',
            'is_enabled' => 'boolean',
            'temperature' => 'float',
            'max_tokens' => 'integer',
            'total_ai_replies' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
