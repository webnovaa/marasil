<?php

declare(strict_types=1);

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Models\UserProfile;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$phone = $argv[1] ?? '+963980212933';
$password = $argv[2] ?? 'webnova.m.w.2000';

$user = User::query()->updateOrCreate(
    ['phone_e164' => $phone],
    [
        'password' => Hash::make($password),
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
        'company_name' => 'WebNova',
        'metadata' => [],
    ],
);

$role = Role::query()->where('name', 'super_admin')->first();
if ($role === null) {
    fwrite(STDERR, "Error: super_admin role missing. Run: php artisan db:seed --class=RolesAndPermissionsSeeder\n");
    exit(1);
}

$user->roles()->syncWithoutDetaching([$role->id]);

if ($user->ownedTenants()->doesntExist()) {
    app(CreateTenantForOwner::class)->handle($user, 'WebNova');
}

echo "Super admin ready: {$phone}\n";
