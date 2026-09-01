<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use App\Http\Middleware\Concerns\RespondsToWebOrApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePermission
{
    use RespondsToWebOrApi;

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $this->deny($request, 'UNAUTHENTICATED', 'Authentication required.', 401);
        }

        if ($permissions !== [] && ! $user->hasAnyPermission($permissions)) {
            if ($this->wantsJsonResponse($request)) {
                return $this->deny($request, 'FORBIDDEN', 'Insufficient permissions.', 403);
            }

            return redirect($user->homeDashboardPath())
                ->with('error', 'ليس لديك الصلاحية المطلوبة لهذا الإجراء.');
        }

        return $next($request);
    }
}
