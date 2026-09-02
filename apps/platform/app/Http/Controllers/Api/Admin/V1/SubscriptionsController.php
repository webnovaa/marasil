<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Actions\AdminCancelSubscription;
use App\Domain\Subscriptions\Actions\AdminExtendSubscription;
use App\Domain\Subscriptions\Actions\AdminSuspendSubscription;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminSubscriptionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class SubscriptionsController extends Controller
{
    public function extend(
        Request $request,
        string $subscriptionUlid,
        AdminExtendSubscription $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('subscriptions.extend'), 403);

        $validated = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $subscription = Subscription::query()->where('ulid', $subscriptionUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            subscription: $subscription,
            days: (int) $validated['days'],
            reason: $validated['reason'] ?? null,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['subscription' => AdminSubscriptionResource::make($updated)]);
    }

    public function suspend(
        Request $request,
        string $subscriptionUlid,
        AdminSuspendSubscription $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('subscriptions.suspend'), 403);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $subscription = Subscription::query()->where('ulid', $subscriptionUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            subscription: $subscription,
            reason: $validated['reason'] ?? null,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['subscription' => AdminSubscriptionResource::make($updated)]);
    }

    public function cancel(
        Request $request,
        string $subscriptionUlid,
        AdminCancelSubscription $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('subscriptions.suspend'), 403);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $subscription = Subscription::query()->where('ulid', $subscriptionUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            subscription: $subscription,
            reason: $validated['reason'] ?? null,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success(['subscription' => AdminSubscriptionResource::make($updated)]);
    }

    private function requestId(Request $request): string
    {
        $existing = $request->attributes->get('request_id')
            ?? $request->headers->get('X-Request-Id');

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        return 'req_'.Str::lower((string) Str::ulid());
    }
}
