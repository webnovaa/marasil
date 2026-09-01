<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Actions\CreateSubscriptionRequest;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\StoreSubscriptionRequestRequest;
use App\Http\Resources\SubscriptionRequestResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class SubscriptionRequestsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            return ApiResponse::error('TENANT_REQUIRED', 'No tenant associated with this account.', 422);
        }

        $items = SubscriptionRequest::query()
            ->with(['plan', 'requester.profile'])
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return ApiResponse::success([
            'subscription_requests' => $items
                ->map(fn (SubscriptionRequest $item) => SubscriptionRequestResource::make($item))
                ->values(),
        ]);
    }

    public function store(
        StoreSubscriptionRequestRequest $request,
        CreateSubscriptionRequest $action,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            throw ValidationException::withMessages([
                'tenant' => ['لا يوجد حساب شركة مرتبط بهذا المستخدم.'],
            ]);
        }

        $plan = Plan::query()
            ->where('ulid', $request->string('plan_id')->toString())
            ->firstOrFail();

        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')
                ?->store("payment-proofs/{$tenant->ulid}", 'local');
        }

        $type = $request->filled('type')
            ? SubscriptionRequestType::from($request->string('type')->toString())
            : SubscriptionRequestType::New;

        $created = $action->handle(
            tenant: $tenant,
            requester: $user,
            plan: $plan,
            type: $type,
            payment: [
                'payment_method' => $request->input('payment_method'),
                'payment_reference' => $request->input('payment_reference'),
                'payment_proof_path' => $proofPath,
                'customer_note' => $request->input('customer_note'),
            ],
        );

        return ApiResponse::success([
            'subscription_request' => SubscriptionRequestResource::make($created),
            'auto_activated' => $created->status === SubscriptionRequestStatus::Approved,
        ], 201);
    }
}
