<?php

declare(strict_types=1);

namespace App\Domain\Platform\Services;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class PlatformTenantService
{
    public function tenant(): Tenant
    {
        $tenant = Tenant::query()
            ->where('slug', (string) config('platform.tenant_slug', '_platform'))
            ->first();

        if ($tenant !== null) {
            return $tenant;
        }

        return $this->createTenant();
    }

    private function createTenant(): Tenant
    {
        $owner = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))
            ->orderBy('id')
            ->first();

        if ($owner === null) {
            throw new RuntimeException('Cannot create platform tenant without a super admin user.');
        }

        return DB::transaction(function () use ($owner): Tenant {
            return Tenant::query()->create([
                'name' => (string) config('platform.tenant_name', 'Marasil Platform'),
                'slug' => (string) config('platform.tenant_slug', '_platform'),
                'owner_user_id' => $owner->id,
                'status' => TenantStatus::Active,
            ]);
        });
    }
}
