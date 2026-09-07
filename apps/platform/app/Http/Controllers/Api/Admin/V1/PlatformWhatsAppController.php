<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlatformDeviceResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

final class PlatformWhatsAppController extends Controller
{
    public function show(PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->device();
        $snapshot = $service->engineSnapshot($device);

        return ApiResponse::success([
            'device' => $device !== null ? PlatformDeviceResource::make($device) : null,
            'is_ready' => $service->isReady(),
            'engine' => (string) config('whatsapp.engine', 'mock'),
            'otp_channel' => $this->otpChannelLabel(),
            'pairing' => $snapshot['pairing'],
            'engine_status' => $snapshot['status'],
        ]);
    }

    public function setup(PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->getOrCreateDevice();

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ], 201);
    }

    public function connect(PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->connect();

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ], 202);
    }

    public function disconnect(PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->disconnect();

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ]);
    }

    public function logout(PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->logout();

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ]);
    }

    public function destroy(PlatformWhatsAppService $service): JsonResponse
    {
        $service->deleteAccount();

        return ApiResponse::success(['deleted' => true]);
    }

    public function update(Request $request, PlatformWhatsAppService $service): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => ['sometimes', 'string', 'max:120'],
        ]);

        $device = $service->updateProfile($validated);

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ]);
    }

    public function uploadAvatar(Request $request, PlatformWhatsAppService $service): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $device = $service->getOrCreateDevice();
        $path = $validated['avatar']->store('platform/avatars', 'public');

        if ($device->avatar_path !== null) {
            Storage::disk('public')->delete($device->avatar_path);
        }

        $device = $service->updateProfile(['avatar_path' => $path]);

        return ApiResponse::success([
            'device' => PlatformDeviceResource::make($device),
        ]);
    }

    public function socketToken(Request $request, PlatformWhatsAppService $service): JsonResponse
    {
        $device = $service->device();
        abort_if($device === null, 404, 'Platform device not configured.');

        $secret = (string) config('whatsapp.socket_token_secret');
        abort_if($secret === '', 503, 'Realtime authentication is not configured.');

        $user = $request->user();
        abort_if($user === null, 401);

        $ttl = min(120, max(30, (int) config('whatsapp.socket_token_ttl_seconds', 90)));
        $claims = [
            'tenant_id' => $device->tenant?->ulid,
            'user_id' => $user->ulid,
            'device_id' => $device->ulid,
            'purpose' => 'device-realtime',
            'exp' => now()->addSeconds($ttl)->timestamp,
        ];
        $payload = rtrim(strtr(base64_encode((string) json_encode($claims, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, $secret, true)), '+/', '-_'), '=');

        return ApiResponse::success(['token' => $payload.'.'.$signature, 'expires_in' => $ttl]);
    }

    private function otpChannelLabel(): string
    {
        $channel = app(\App\Domain\Identity\Contracts\OtpChannel::class);

        return match ($channel::class) {
            \App\Domain\Identity\Services\WhatsAppOtpChannel::class => 'whatsapp',
            \App\Domain\Identity\Services\FakeOtpChannel::class => 'fake',
            default => 'unconfigured',
        };
    }
}
