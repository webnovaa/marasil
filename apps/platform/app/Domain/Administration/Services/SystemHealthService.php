<?php

declare(strict_types=1);

namespace App\Domain\Administration\Services;

use App\Domain\Identity\Contracts\OtpChannel;
use App\Domain\Identity\Services\FakeOtpChannel;
use App\Domain\Identity\Services\UnconfiguredOtpChannel;
use App\Domain\Identity\Services\WhatsAppOtpChannel;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

final class SystemHealthService
{
    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        return [
            'checked_at' => now()->toIso8601String(),
            'database' => $this->probeDatabase(),
            'redis' => $this->probeRedis(),
            'queue' => $this->probeQueue(),
            'whatsapp_service' => $this->probeWhatsAppService(),
            'platform_whatsapp' => $this->probePlatformWhatsApp(),
            'otp_channel' => $this->otpChannelLabel(),
            'config' => [
                'whatsapp_engine' => (string) config('whatsapp.engine', 'mock'),
                'queue_driver' => (string) config('queue.default'),
                'cache_driver' => (string) config('cache.default'),
            ],
        ];
    }

    /**
     * @return array{ok: bool, latency_ms: int|null, message: string}
     */
    private function probeDatabase(): array
    {
        $started = microtime(true);

        try {
            DB::select('select 1 as ok');

            return [
                'ok' => true,
                'latency_ms' => (int) round((microtime(true) - $started) * 1000),
                'message' => 'connected',
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'latency_ms' => null,
                'message' => 'unreachable',
            ];
        }
    }

    /**
     * @return array{ok: bool, latency_ms: int|null, message: string}
     */
    private function probeRedis(): array
    {
        $started = microtime(true);

        try {
            $key = 'health:probe:'.uniqid('', true);
            Cache::store('redis')->put($key, '1', 5);
            Cache::store('redis')->forget($key);

            return [
                'ok' => true,
                'latency_ms' => (int) round((microtime(true) - $started) * 1000),
                'message' => 'connected',
            ];
        } catch (\Throwable) {
            try {
                Redis::ping();

                return [
                    'ok' => true,
                    'latency_ms' => (int) round((microtime(true) - $started) * 1000),
                    'message' => 'connected',
                ];
            } catch (\Throwable) {
                return [
                    'ok' => false,
                    'latency_ms' => null,
                    'message' => 'unreachable',
                ];
            }
        }
    }

    /**
     * @return array{ok: bool, message: string, driver: string}
     */
    private function probeQueue(): array
    {
        $driver = (string) config('queue.default');

        try {
            $size = Queue::size('default');

            return [
                'ok' => true,
                'message' => "driver={$driver}, pending={$size}",
                'driver' => $driver,
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'message' => $driver.': '.$e->getMessage(),
                'driver' => $driver,
            ];
        }
    }

    /**
     * @return array{ok: bool, message: string, engine?: string}
     */
    private function probeWhatsAppService(): array
    {
        $url = rtrim((string) config('whatsapp.service_url'), '/').'/health/ready';

        try {
            $response = Http::timeout(5)->get($url);
            $json = $response->json();
            $ready = $response->successful() && is_array($json) && ($json['status'] ?? '') === 'ready';

            return [
                'ok' => $ready,
                'message' => $ready ? 'ready' : 'not_ready',
                'engine' => is_array($json) ? (string) ($json['engine'] ?? '') : '',
            ];
        } catch (\Throwable) {
            return [
                'ok' => false,
                'message' => 'unreachable',
            ];
        }
    }

    /**
     * @return array{ok: bool, message: string, device_status?: string|null}
     */
    private function probePlatformWhatsApp(): array
    {
        try {
            $service = app(PlatformWhatsAppService::class);
            $device = $service->device();

            if ($device === null) {
                return ['ok' => false, 'message' => 'not_configured', 'device_status' => null];
            }

            return [
                'ok' => $service->isReady(),
                'message' => $service->isReady() ? 'connected' : 'not_connected',
                'device_status' => $device->status->value ?? (string) $device->status,
            ];
        } catch (\Throwable) {
            return ['ok' => false, 'message' => 'error', 'device_status' => null];
        }
    }

    private function otpChannelLabel(): string
    {
        $channel = app(OtpChannel::class);

        return match ($channel::class) {
            WhatsAppOtpChannel::class => 'whatsapp',
            FakeOtpChannel::class => 'fake',
            UnconfiguredOtpChannel::class => 'unconfigured',
            default => 'unknown',
        };
    }
}
