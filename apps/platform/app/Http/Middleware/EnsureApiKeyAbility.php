<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureApiKeyAbility
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $apiKey = $request->attributes->get('api_key');

        if (! $apiKey instanceof ApiKey) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        $abilities = $apiKey->abilities ?? [];

        if (! is_array($abilities)) {
            $abilities = [];
        }

        if (! in_array('*', $abilities, true) && ! in_array($ability, $abilities, true)) {
            return ApiResponse::error('PERMISSION_DENIED', 'API key is missing the required ability.', 403);
        }

        return $next($request);
    }
}
