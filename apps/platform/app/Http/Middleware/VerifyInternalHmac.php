<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Devices\Services\InternalHmacService;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

final class VerifyInternalHmac
{
    public function __construct(
        private readonly InternalHmacService $hmac,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $valid = $this->hmac->verifyRequest($request);
        } catch (RuntimeException) {
            return ApiResponse::error('FORBIDDEN', 'Internal authentication is not configured.', 403);
        }

        if (! $valid) {
            return ApiResponse::error('FORBIDDEN', 'Invalid internal signature.', 403);
        }

        $nonce = (string) $request->header('X-Internal-Nonce', '');
        if (! preg_match('/^[0-9a-f-]{36}$/i', $nonce)) {
            return ApiResponse::error('FORBIDDEN', 'Invalid internal nonce.', 403);
        }
        $ttl = max(30, (int) config('whatsapp.hmac_max_skew_seconds', 300));
        if (! Cache::add('internal-hmac-nonce:'.hash('sha256', $nonce), true, $ttl)) {
            return ApiResponse::error('REPLAY_DETECTED', 'Internal request was already processed.', 409);
        }

        return $next($request);
    }
}
