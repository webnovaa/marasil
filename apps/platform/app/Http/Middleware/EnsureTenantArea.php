<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use App\Http\Middleware\Concerns\RespondsToWebOrApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureTenantArea
{
    use RespondsToWebOrApi;

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $this->deny($request, 'UNAUTHENTICATED', 'Authentication required.', 401);
        }

        if ($user->canAccessTenantArea()) {
            return $next($request);
        }

        if ($request->routeIs('tenant.plans', 'tenant.plans.subscribe', 'tenant.subscription')
            && ($user->isTenantUser() || $user->primaryTenant() !== null)) {
            return $next($request);
        }

        if ($this->wantsJsonResponse($request)) {
            return $this->deny($request, 'FORBIDDEN', 'Tenant access required.', 403);
        }

        return redirect($user->homeDashboardPath())
            ->with('error', __('messages.access.tenant_denied'));
    }
}
