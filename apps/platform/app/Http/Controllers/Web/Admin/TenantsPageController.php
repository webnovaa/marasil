<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminTenantResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TenantsPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('users.view'), 403);

        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');

        $query = Tenant::query()
            ->with(['owner.profile'])
            ->where('slug', '!=', (string) config('platform.tenant_slug', '_platform'))
            ->orderByDesc('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('slug', 'like', '%'.$search.'%');
            });
        }

        if ($status !== '' && TenantStatus::tryFrom($status)) {
            $query->where('status', $status);
        }

        $tenants = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Tenants/Index', [
            'tenants' => $tenants->getCollection()->map(fn (Tenant $t) => AdminTenantResource::make($t))->values(),
            'filters' => ['search' => $search, 'status' => $status],
            'statusOptions' => array_map(fn (TenantStatus $s) => $s->value, TenantStatus::cases()),
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ],
        ]);
    }
}
