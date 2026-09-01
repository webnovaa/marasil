<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Actions;

use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Enums\TenantMemberStatus;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Tenancy\Models\TenantMember;
use Illuminate\Support\Str;

final class CreateTenantForOwner
{
    public function handle(User $user, string $name, TenantStatus $status = TenantStatus::Pending): Tenant
    {
        $baseSlug = Str::slug($name) ?: 'tenant';
        $slug = $baseSlug;
        $suffix = 1;

        while (Tenant::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        $tenant = Tenant::query()->create([
            'name' => $name,
            'slug' => $slug,
            'owner_user_id' => $user->id,
            'status' => $status,
        ]);

        TenantMember::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'tenant_owner',
            'status' => TenantMemberStatus::Active,
        ]);

        $ownerRole = Role::query()->where('name', 'tenant_owner')->first();
        if ($ownerRole !== null) {
            $user->roles()->syncWithoutDetaching([$ownerRole->id]);
        }

        return $tenant;
    }
}
