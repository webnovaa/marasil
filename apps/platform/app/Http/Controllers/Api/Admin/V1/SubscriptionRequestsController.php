<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Actions\AdminApproveSubscriptionRequest;
use App\Domain\Subscriptions\Actions\AdminRejectSubscriptionRequest;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveSubscriptionRequestRequest;
use App\Http\Requests\Admin\RejectSubscriptionRequestRequest;
use App\Http\Resources\SubscriptionRequestResource;
use App\Http\Resources\SubscriptionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class SubscriptionRequestsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SubscriptionRequest::class);

        $status = $request->string('status')->toString();
        $query = SubscriptionRequest::query()
            ->with(['plan', 'tenant', 'requester.profile'])
            ->orderByDesc('created_at');

        if ($status !== '' && SubscriptionRequestStatus::tryFrom($status)) {
            $query->where('status', $status);
        } else {
            $query->where('status', SubscriptionRequestStatus::Pending);
        }

        $items = $query->paginate(20);

        return ApiResponse::success([
            'subscription_requests' => $items->getCollection()
                ->map(fn (SubscriptionRequest $item) => SubscriptionRequestResource::make($item))
                ->values(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function approve(
        ApproveSubscriptionRequestRequest $request,
        string $requestUlid,
        AdminApproveSubscriptionRequest $action,
    ): JsonResponse {
        $target = SubscriptionRequest::query()
            ->where('ulid', $requestUlid)
            ->firstOrFail();

        $this->authorize('approve', $target);

        /** @var User $actor */
        $actor = $request->user();

        $subscription = $action->handle(
            actor: $actor,
            request: $target,
            adminNote: $request->input('admin_note'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success([
            'subscription' => SubscriptionResource::make($subscription),
            'subscription_request' => SubscriptionRequestResource::make($target->fresh(['plan', 'tenant', 'requester.profile'])),
        ]);
    }

    public function reject(
        RejectSubscriptionRequestRequest $request,
        string $requestUlid,
        AdminRejectSubscriptionRequest $action,
    ): JsonResponse {
        $target = SubscriptionRequest::query()
            ->where('ulid', $requestUlid)
            ->firstOrFail();

        $this->authorize('reject', $target);

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            request: $target,
            reason: $request->string('reason')->toString(),
            adminNote: $request->input('admin_note'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success([
            'subscription_request' => SubscriptionRequestResource::make($updated),
        ]);
    }

    public function paymentProof(Request $request, string $requestUlid): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('viewAny', SubscriptionRequest::class);

        $target = SubscriptionRequest::query()
            ->where('ulid', $requestUlid)
            ->firstOrFail();

        $path = $target->payment_proof_path;

        if ($path === null || ! Storage::disk('local')->exists($path)) {
            return ApiResponse::error('NOT_FOUND', 'Payment proof not found.', 404);
        }

        if ($request->boolean('download')) {
            return Storage::disk('local')->download($path, basename($path));
        }

        return Storage::disk('local')->response($path);
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
