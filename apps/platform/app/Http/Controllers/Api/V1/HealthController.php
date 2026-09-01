<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Contracts\OtpChannel;
use App\Domain\Identity\Services\UnconfiguredOtpChannel;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $otpChannel = app(OtpChannel::class);
        $otpConfigured = ! $otpChannel instanceof UnconfiguredOtpChannel;
        $engine = (string) config('whatsapp.engine', 'mock');
        $engineReady = app()->environment(['local', 'testing']) || $engine === 'baileys';

        $healthy = $otpConfigured && $engineReady;

        return ApiResponse::success(
            data: [
                'status' => $healthy ? 'ok' : 'unhealthy',
                'service' => 'platform',
                'time' => now()->utc()->toIso8601String(),
                'checks' => [
                    'otp_channel' => $otpConfigured ? 'configured' : 'unconfigured',
                    'whatsapp_engine' => $engine,
                ],
            ],
            status: $healthy ? 200 : 503,
        );
    }
}
