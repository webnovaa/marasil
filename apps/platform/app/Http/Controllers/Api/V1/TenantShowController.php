<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Temporary Phase-2 smoke endpoint for tenant isolation tests.
 */
final class TenantShowController extends Controller
{
    public function __invoke(Request $request, string $tenantUlid): JsonResponse
    {
        $tenant = Tenant::query()->where('ulid', $tenantUlid)->firstOrFail();

        $this->authorize('view', $tenant);

        return ApiResponse::success([
            'id' => $tenant->ulid,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'status' => $tenant->status->value,
        ]);
    }
}
