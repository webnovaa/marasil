<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class TenantsPageController extends Controller
{
    public function __invoke(): Response
    {
        $tenants = Tenant::query()
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (Tenant $tenant): array => [
                'id' => $tenant->ulid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status->value,
            ]);

        return Inertia::render('Admin/Tenants/Index', ['tenants' => $tenants]);
    }
}
