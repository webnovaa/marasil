<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Prints development login credentials defined in seeders (never in .env).
 */
final class DevelopmentAccountsSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $this->command?->newLine();
        $this->command?->info('=== حسابات التطوير (من السيدرات فقط) ===');
        $this->command?->info('  Super admin : '.SuperAdminSeeder::PHONE.' / '.SuperAdminSeeder::PASSWORD);
        $this->command?->info('  Demo tenant : '.DemoDataSeeder::DEMO_OWNER_PHONE.' / '.DemoDataSeeder::DEMO_OWNER_PASSWORD);
        $this->command?->info('  Admin panel : http://localhost:8080/admin');
        $this->command?->info('  Tenant app  : http://localhost:8080/tenant');
        $this->command?->newLine();
    }
}
