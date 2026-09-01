<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\ApiKeys\Models\ApiKey;
use App\Domain\Messaging\Actions\AcceptMediaMessage;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMediaMessageRequest;
use App\Http\Requests\Messaging\StoreTextMessageRequest;
use App\Http\Resources\MessageResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class MessagesController extends Controller
{
    public function storeText(StoreTextMessageRequest $request, AcceptTextMessage $action): JsonResponse
    {
        /** @var ApiKey $apiKey */
        $apiKey = $request->attributes->get('api_key');
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        $payload = $request->validated();
        $payload['idempotency_key'] = $request->header('Idempotency-Key');

        $result = $action->handle($tenant, $payload, $apiKey);

        return ApiResponse::success(
            ['message' => MessageResource::make($result['message'])],
            202,
            ['idempotent_replay' => ! $result['created']],
        );
    }

    public function storeMedia(StoreMediaMessageRequest $request, AcceptMediaMessage $action): JsonResponse
    {
        /** @var ApiKey $apiKey */
        $apiKey = $request->attributes->get('api_key');
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        $payload = $request->validated();
        unset($payload['file']);
        $payload['idempotency_key'] = $request->header('Idempotency-Key');

        $result = $action->handle($tenant, $payload, $request->file('file'), $apiKey);

        return ApiResponse::success(
            ['message' => MessageResource::make($result['message'])],
            202,
            ['idempotent_replay' => ! $result['created']],
        );
    }

    public function index(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        $messages = Message::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        return ApiResponse::success([
            'messages' => array_map(
                static fn (Message $message): array => MessageResource::make($message),
                $messages->all(),
            ),
        ]);
    }

    public function show(Request $request, Message $message): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->attributes->get('tenant');

        if ((int) $message->tenant_id !== (int) $tenant->id) {
            return ApiResponse::error('MESSAGE_NOT_FOUND', 'Message not found.', 404);
        }

        return ApiResponse::success(['message' => MessageResource::make($message)]);
    }
}
