<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\ApiKeys\Actions\CreateApiKey;
use App\Domain\ApiKeys\Actions\RevokeApiKey;
use App\Domain\ApiKeys\Actions\RotateApiKey;
use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApiKeys\StoreApiKeyRequest;
use App\Http\Resources\ApiKeyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        ]);
    }

    public function store(StoreApiKeyRequest $request, CreateApiKey $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('create', ApiKey::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $result = $action->handle($tenant, $request->validated());

        return ApiResponse::success([
            'api_key' => ApiKeyResource::make($result['api_key'], $result['plain_text_key']),
        ], 201);
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

        $result = $action->handle($apiKey, $user);

        return ApiResponse::success([
            'api_key' => ApiKeyResource::make($result['api_key'], $result['plain_text_key']),
        ]);
    }
}
