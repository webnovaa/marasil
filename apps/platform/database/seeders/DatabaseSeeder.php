<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

        if (app()->environment(['local', 'testing'])) {
            $this->call([
                SuperAdminSeeder::class,
                PlatformSystemSeeder::class,
                PlansSeeder::class,
                PlatformSettingsAndPaymentMethodsSeeder::class,
                DemoDataSeeder::class,
                DevelopmentAccountsSeeder::class,
            ]);

            return;
        }

        $this->call([
            ProductionBootstrapSeeder::class,
            PlatformSystemSeeder::class,
            PlansSeeder::class,
            PlatformSettingsAndPaymentMethodsSeeder::class,
        ]);
    }
}
