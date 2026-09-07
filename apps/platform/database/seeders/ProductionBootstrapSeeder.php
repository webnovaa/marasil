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
 * Production/staging bootstrap: first super admin from Docker/.env config.
 * Skips when credentials are missing. Safe to re-run (updateOrCreate).
 *
 * Docker root .env:
 *   SUPER_ADMIN_PHONE=+9639xxxxxxx
 *   SUPER_ADMIN_PASSWORD=… (min 12 chars)
 *   SUPER_ADMIN_NAME=…        (optional)
 *   SUPER_ADMIN_COMPANY=…     (optional)
 *   RUN_DB_SEED=true          (with entrypoint on api / php-fpm)
 */
final class ProductionBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment(['local', 'testing'])) {
            return;
        }

        $phone = trim((string) config('platform.bootstrap.super_admin_phone', ''));
        $password = (string) config('platform.bootstrap.super_admin_password', '');
        $name = trim((string) config('platform.bootstrap.super_admin_name', 'Super Admin')) ?: 'Super Admin';
        $company = trim((string) config('platform.bootstrap.super_admin_company', ''))
            ?: (string) config('app.name', 'Marasil');

        if ($phone === '' || $password === '') {
            $this->command?->warn(
                'ProductionBootstrapSeeder skipped: set SUPER_ADMIN_PHONE and SUPER_ADMIN_PASSWORD in the Docker .env.'
            );

            return;
        }

        if (! str_starts_with($phone, '+') || strlen($phone) < 10) {
            $this->command?->error('SUPER_ADMIN_PHONE must be E.164 (e.g. +9639xxxxxxx).');

            return;
        }

        if (strlen($password) < 12) {
            $this->command?->error('SUPER_ADMIN_PASSWORD must be at least 12 characters.');

            return;
        }

        DB::transaction(function () use ($phone, $password, $name, $company): void {
            $role = Role::query()->where('name', 'super_admin')->first();
            if ($role === null) {
                throw new \RuntimeException('super_admin role missing. Run RolesAndPermissionsSeeder first.');
            }

            $user = User::query()->updateOrCreate(
                ['phone_e164' => $phone],
                [
                    'password' => Hash::make($password),
                    'phone_verified_at' => now(),
                    'status' => UserStatus::Active,
                    'preferred_locale' => config('app.locale', 'ar'),
                    'timezone' => config('app.timezone', 'UTC'),
                    'approved_at' => now(),
                ],
            );

            UserProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $name,
                    'company_name' => $company,
                    'metadata' => ['bootstrap' => true],
                ],
            );

            $user->roles()->syncWithoutDetaching([$role->id]);

            if ($user->ownedTenants()->doesntExist()) {
                app(CreateTenantForOwner::class)->handle($user, $company.' Platform');
            }
        });

        $this->command?->info('Super admin ready for '.$phone.' — change the password after first login.');
    }
}
