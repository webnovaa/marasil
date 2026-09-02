<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Platform\Services\PlatformTenantService;
use Illuminate\Database\Seeder;

final class PlatformSystemSeeder extends Seeder
{
    public function run(): void
    {
        app(PlatformTenantService::class)->tenant();
    }
}
