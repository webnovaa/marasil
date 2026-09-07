<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Always safe for production / staging / local.
        $this->call([
            RolesAndPermissionsSeeder::class,
            PlatformSystemSeeder::class,
            PlansSeeder::class,
        ]);

        if (app()->environment(['local', 'testing'])) {
            // Dev-only accounts + sample tenant data (hardcoded, never for production).
            $this->call([
                SuperAdminSeeder::class,
                DemoDataSeeder::class,
                DevelopmentAccountsSeeder::class,
            ]);

            return;
        }

        // Production/staging: first admin from env (optional but recommended).
        $this->call([
            ProductionBootstrapSeeder::class,
        ]);
    }
}
