<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\ApiKeys\ApiKeyPrefix;
use App\Domain\ApiKeys\Models\ApiKey;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateApiKey
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! is_string($header) || ! str_starts_with($header, 'Bearer ')) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        $rawKey = trim(substr($header, 7));

        if ($rawKey === '' || ! preg_match(ApiKeyPrefix::pattern(), $rawKey)) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        $parts = explode('_', $rawKey);
        // mrs_live_{publicId}_{secret} => prefix = mrs_live_{publicId}
        if (count($parts) < 4) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        $prefix = $parts[0].'_'.$parts[1].'_'.$parts[2];

        $apiKey = ApiKey::query()->where('prefix', $prefix)->first();

        if ($apiKey === null) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        if ($apiKey->revoked_at !== null) {
            return ApiResponse::error('API_KEY_REVOKED', 'API key has been revoked.', 401);
        }

        if ($apiKey->expires_at !== null && $apiKey->expires_at->isPast()) {
            return ApiResponse::error('API_KEY_EXPIRED', 'API key has expired.', 401);
        }

        if (! hash_equals($apiKey->secret_hash, hash('sha256', $rawKey))) {
            return ApiResponse::error('API_KEY_INVALID', 'Missing or invalid API key.', 401);
        }

        $apiKey->forceFill([
            'last_used_at' => now(),
            'last_used_ip' => $request->ip(),
        ])->save();

        $request->attributes->set('api_key', $apiKey);
        $request->attributes->set('tenant', $apiKey->tenant);

        return $next($request);
    }
}
