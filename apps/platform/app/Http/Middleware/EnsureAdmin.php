<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use App\Http\Middleware\Concerns\RespondsToWebOrApi;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdmin
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

        if (! $user->canAccessAdminPanel()) {
            if ($this->wantsJsonResponse($request)) {
                return ApiResponse::error('FORBIDDEN', 'Admin access required.', 403);
            }

            return redirect($user->homeDashboardPath())
                ->with('error', __('messages.access.admin_denied'));
        }

        return $next($request);
    }
}
