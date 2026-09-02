<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Tenancy\Models\Tenant;

final class AdminTenantResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Tenant $tenant): array
    {
        $tenant->loadMissing(['owner.profile']);

        return [
            'id' => $tenant->ulid,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'status' => $tenant->status->value,
            'created_at' => $tenant->created_at?->toIso8601String(),
            'owner' => $tenant->owner ? [
                'id' => $tenant->owner->ulid,
                'full_name' => $tenant->owner->profile?->full_name,
                'phone_e164' => $tenant->owner->phone_e164,
                'status' => $tenant->owner->status->value,
            ] : null,
        ];
    }
}
