<?php

declare(strict_types=1);

namespace App\Domain\Templates\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageTemplate extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'category',
        'status',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TemplateVersion::class);
    }

    public function currentVersion(): ?TemplateVersion
    {
        return $this->versions()->where('is_current', true)->first();
    }
}
