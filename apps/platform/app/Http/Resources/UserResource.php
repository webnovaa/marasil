<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Tenant;

final class UserResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(User $user): array
    {
        $user->loadMissing(['profile', 'roles']);

        return [
            'id' => $user->ulid,
            'phone_e164' => $user->phone_e164,
            'phone_verified_at' => $user->phone_verified_at?->toIso8601String(),
            'status' => $user->status->value,
            'preferred_locale' => $user->preferred_locale,
            'timezone' => $user->timezone,
            'full_name' => $user->profile?->full_name,
            'company_name' => $user->profile?->company_name,
            'roles' => $user->roles->pluck('name')->values()->all(),
            'tenant' => self::tenantSummary($user->primaryTenant()),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function tenantSummary(?Tenant $tenant): ?array
    {
        if ($tenant === null) {
            return null;
        }

        return [
            'id' => $tenant->ulid,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'status' => $tenant->status->value,
        ];
    }
}
