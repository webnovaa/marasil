<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Webhooks\Actions\CreateWebhook;
use App\Domain\Webhooks\Actions\RotateSecret;
use App\Domain\Webhooks\Actions\TestWebhook;
use App\Domain\Webhooks\Actions\UpdateWebhook;
use App\Domain\Webhooks\Models\WebhookDelivery;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Http\Controllers\Controller;
use App\Http\Requests\Webhooks\StoreWebhookRequest;
use App\Http\Requests\Webhooks\UpdateWebhookRequest;
use App\Http\Resources\WebhookDeliveryResource;
use App\Http\Resources\WebhookEndpointResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WebhooksController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', WebhookEndpoint::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $endpoints = WebhookEndpoint::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('id')
            ->get();

        return ApiResponse::success([
            'webhooks' => WebhookEndpointResource::collection($endpoints),
        ]);
    }

    public function store(StoreWebhookRequest $request, CreateWebhook $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('create', WebhookEndpoint::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $result = $action->handle($tenant, $request->validated());

        return ApiResponse::success([
            'webhook' => WebhookEndpointResource::make($result['endpoint'], $result['plain_secret']),
        ], 201);
    }

    public function update(
        UpdateWebhookRequest $request,
        WebhookEndpoint $webhook,
        UpdateWebhook $action,
    ): JsonResponse {
        $this->authorize('update', $webhook);

        $endpoint = $action->handle($webhook, $request->validated());

        return ApiResponse::success([
            'webhook' => WebhookEndpointResource::make($endpoint),
        ]);
    }

    public function destroy(WebhookEndpoint $webhook): JsonResponse
    {
        $this->authorize('delete', $webhook);

        $webhook->delete();

        return ApiResponse::success(['deleted' => true]);
    }

    public function test(WebhookEndpoint $webhook, TestWebhook $action): JsonResponse
    {
        $this->authorize('test', $webhook);

        $delivery = $action->handle($webhook);

        return ApiResponse::success([
            'delivery' => WebhookDeliveryResource::make($delivery),
        ], 202);
    }

    public function rotateSecret(WebhookEndpoint $webhook, RotateSecret $action): JsonResponse
    {
        $this->authorize('rotate', $webhook);

        $result = $action->handle($webhook);

        return ApiResponse::success([
            'webhook' => WebhookEndpointResource::make($result['endpoint'], $result['plain_secret']),
        ]);
    }

    public function deliveries(WebhookEndpoint $webhook): JsonResponse
    {
        $this->authorize('view', $webhook);

        $deliveries = WebhookDelivery::query()
            ->where('webhook_endpoint_id', $webhook->id)
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        return ApiResponse::success([
            'deliveries' => WebhookDeliveryResource::collection($deliveries),
        ]);
    }
}
