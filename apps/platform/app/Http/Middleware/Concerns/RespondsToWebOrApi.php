<?php

declare(strict_types=1);

namespace App\Http\Middleware\Concerns;

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

trait RespondsToWebOrApi
{
    protected function wantsJsonResponse(Request $request): bool
    {
        return $request->expectsJson() || $request->is('api/*');
    }

    protected function deny(Request $request, string $code, string $message, int $status = 403): Response
    {
        if ($this->wantsJsonResponse($request)) {
            return ApiResponse::error($code, $message, $status);
        }

        abort($status, $message);
    }
}
