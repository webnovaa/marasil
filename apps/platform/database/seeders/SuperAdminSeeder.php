<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Models\UserProfile;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Local/testing super admin only. Production uses ProductionBootstrapSeeder + env.
 */
class SuperAdminSeeder extends Seeder
{
    public const PHONE = '+963980212933';

    public const PASSWORD = 'webnova.m.w.2000';

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('Skipping SuperAdminSeeder outside local/testing.');

            return;
        }

        DB::transaction(function (): void {
            $user = User::query()->updateOrCreate(
                ['phone_e164' => self::PHONE],
                [
                    'password' => Hash::make(self::PASSWORD),
                    'phone_verified_at' => now(),
                    'status' => UserStatus::Active,
                    'preferred_locale' => 'ar',
                    'timezone' => 'UTC',
                    'approved_at' => now(),
                ],
            );

            UserProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => 'Super Admin',
                    'company_name' => 'Platform',
                    'metadata' => ['seeded' => 'local'],
                ],
            );

            $role = Role::query()->where('name', 'super_admin')->first();
            if ($role === null) {
                throw new \RuntimeException('super_admin role missing. Run RolesAndPermissionsSeeder first.');
            }

            $user->roles()->syncWithoutDetaching([$role->id]);

            if ($user->ownedTenants()->doesntExist()) {
                app(CreateTenantForOwner::class)->handle($user, 'Marasil Platform');
            }
        });
    }
}
