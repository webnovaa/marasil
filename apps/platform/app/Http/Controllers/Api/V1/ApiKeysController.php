<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\ApiKeys\Actions\RevokeApiKey;
use App\Domain\ApiKeys\Actions\RotateApiKey;
use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiKeyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Device-bound keys are managed from /devices. This controller only lists/revokes/rotates
 * existing keys for compatibility — creation is not supported.
 */
final class ApiKeysController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', ApiKey::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $keys = ApiKey::query()
            ->with('device')
            ->where('tenant_id', $tenant->id)
            ->whereNotNull('device_id')
            ->orderByDesc('id')
            ->get();

        return ApiResponse::success([
            'api_keys' => ApiKeyResource::collection($keys),
            'tenant' => [
                'username' => $tenant->slug,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
            ],
            'api_base_url' => rtrim($request->getSchemeAndHttpHost(), '/').'/api/v1',
            'note' => 'API keys are created automatically with each device. Use POST /devices/{id}/rotate-api-key to rotate.',
        ]);
    }

    public function destroy(Request $request, ApiKey $apiKey, RevokeApiKey $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('delete', $apiKey);

        $action->handle($apiKey, $user);

        return ApiResponse::success(['revoked' => true]);
    }

    public function rotate(Request $request, ApiKey $apiKey, RotateApiKey $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('rotate', $apiKey);

        if ($apiKey->device_id === null) {
            return ApiResponse::error(
                'DEVICE_KEY_REQUIRED',
                'Standalone API keys are no longer supported. Rotate from the device page.',
                422,
            );
        }

        $result = $action->handle($apiKey, $user);

        return ApiResponse::success([
            'api_key' => ApiKeyResource::make($result['api_key'], $result['plain_text_key']),
        ]);
    }
}
