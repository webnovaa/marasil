<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Actions\AdminUpdateTenantStatus;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTenantResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class TenantsController extends Controller
{
    public function updateStatus(
        Request $request,
        string $tenantUlid,
        AdminUpdateTenantStatus $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('users.suspend'), 403);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended,closed'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $tenant = Tenant::query()->where('ulid', $tenantUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            tenant: $tenant,
            status: TenantStatus::from($validated['status']),
            reason: $validated['reason'] ?? null,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['tenant' => AdminTenantResource::make($updated)]);
    }

    private function requestId(Request $request): string
    {
        $existing = $request->attributes->get('request_id')
            ?? $request->headers->get('X-Request-Id');

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        return 'req_'.Str::lower((string) Str::ulid());
    }
}
