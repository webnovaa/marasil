<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return ApiResponse::error('UNAUTHENTICATED', 'Authentication required.', 401);
        }

        if ($user->status !== UserStatus::Active) {
            $code = match ($user->status) {
                UserStatus::PendingPhoneVerification => 'PHONE_NOT_VERIFIED',
                UserStatus::PendingApproval => 'ACCOUNT_PENDING_APPROVAL',
                UserStatus::Suspended, UserStatus::Disabled, UserStatus::Rejected => 'ACCOUNT_SUSPENDED',
                default => 'FORBIDDEN',
            };

            return ApiResponse::error($code, 'Account is not active.', 403);
        }

        return $next($request);
    }
}
