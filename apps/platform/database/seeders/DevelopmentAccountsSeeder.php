<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Prints local/dev login credentials from seeders (never runs in production).
 */
final class DevelopmentAccountsSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $this->command?->newLine();
        $this->command?->info('=== حسابات التطوير المحلية فقط ===');
        $this->command?->info('  Super admin : '.SuperAdminSeeder::PHONE.' / '.SuperAdminSeeder::PASSWORD);
        $this->command?->info('  Demo tenant : '.DemoDataSeeder::DEMO_OWNER_PHONE.' / '.DemoDataSeeder::DEMO_OWNER_PASSWORD);
        $this->command?->info('  Admin panel : '.rtrim((string) config('app.url'), '/').'/admin');
        $this->command?->info('  Tenant app  : '.rtrim((string) config('app.url'), '/').'/tenant');
        $this->command?->warn('  هذه الحسابات لا تُنشأ على السيرفر (production).');
        $this->command?->newLine();
    }
}
