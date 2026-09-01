<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

final class ApiResponse
{
    /**
     * @param  array<string, mixed>|list<mixed>|object|null  $data
     * @param  array<string, mixed>  $meta
     */
    public static function success(
        mixed $data = null,
        int $status = 200,
        array $meta = [],
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => array_merge([
                'request_id' => self::requestId(),
            ], $meta),
        ], $status);
    }

    /**
     * @param  array<string, mixed>  $details
     * @param  array<string, mixed>  $meta
     */
    public static function error(
        string $code,
        string $message,
        int $status = 400,
        array $details = [],
        array $meta = [],
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => (object) $details,
            ],
            'meta' => array_merge([
                'request_id' => self::requestId(),
            ], $meta),
        ], $status);
    }

    private static function requestId(): string
    {
        $existing = request()->attributes->get('request_id')
            ?? request()->headers->get('X-Request-Id');

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        return 'req_'.Str::lower((string) Str::ulid());
    }
}
