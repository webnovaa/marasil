<?php

declare(strict_types=1);

namespace App\Domain\Contacts\Models;

use App\Domain\Tenancy\Models\Tenant;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    use HasUlid;

    protected $fillable = [
        'tenant_id',
        'group_id',
        'name',
        'phone_e164',
        'is_whatsapp_verified',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_whatsapp_verified' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class, 'group_id');
    }
}
