<?php

declare(strict_types=1);

namespace App\Domain\Contacts\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactGroup extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'name',
        'color',
        'description',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'group_id');
    }
}
