<?php

declare(strict_types=1);

use App\Http\Middleware\AuthenticateApiKey;
use App\Http\Middleware\EnsureActiveSubscription;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureApiKeyAbility;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureTenantArea;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\VerifyInternalHmac;
use App\Domain\Identity\Models\User;
use App\Support\ApiResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->redirectUsersTo(function (Request $request): string {
            $user = $request->user();

            return $user instanceof User
                ? $user->homeDashboardPath()
                : '/dashboard';
        });

        $middleware->append(SecurityHeaders::class);

        $middleware->web(append: [
            SetLocale::class,
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'permission' => EnsurePermission::class,
            'tenant.area' => EnsureTenantArea::class,
            'active' => EnsureUserIsActive::class,
            'verified.phone' => EnsureUserIsActive::class,
            'subscription.active' => EnsureActiveSubscription::class,
            'api.key' => AuthenticateApiKey::class,
            'api.ability' => EnsureApiKeyAbility::class,
            'internal.hmac' => VerifyInternalHmac::class,
        ]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = $e->getStatusCode();
                $code = match ($status) {
                    401 => 'UNAUTHENTICATED',
                    403 => 'FORBIDDEN',
                    404 => 'NOT_FOUND',
                    422 => 'VALIDATION_ERROR',
                    429 => 'RATE_LIMIT_EXCEEDED',
                    default => 'HTTP_ERROR',
                };

                return ApiResponse::error($code, $e->getMessage() ?: 'Request failed.', $status);
            }

            return null;
        });
    })->create();
