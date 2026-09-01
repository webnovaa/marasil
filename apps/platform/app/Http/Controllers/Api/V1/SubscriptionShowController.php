<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Actions\CreateSubscriptionRequest;
use App\Domain\Subscriptions\Actions\GetCurrentSubscription;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\StoreRenewalRequestRequest;
use App\Http\Resources\SubscriptionRequestResource;
use App\Http\Resources\SubscriptionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class SubscriptionShowController extends Controller
{
    public function show(Request $request, GetCurrentSubscription $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            return ApiResponse::error('TENANT_REQUIRED', 'No tenant associated with this account.', 422);
        }

        $subscription = $action->handle($tenant);

        return ApiResponse::success([
            'subscription' => $subscription
                ? SubscriptionResource::make($subscription->loadMissing('plan'))
                : null,
        ]);
    }

    public function renewalRequest(
        StoreRenewalRequestRequest $request,
        CreateSubscriptionRequest $action,
        GetCurrentSubscription $currentSubscription,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            throw ValidationException::withMessages([
                'tenant' => ['لا يوجد حساب شركة مرتبط بهذا المستخدم.'],
            ]);
        }

        $planUlid = $request->input('plan_id');
        if (is_string($planUlid) && $planUlid !== '') {
            $plan = Plan::query()->where('ulid', $planUlid)->firstOrFail();
        } else {
            $current = $currentSubscription->handle($tenant);
            if ($current === null) {
                throw ValidationException::withMessages([
                    'plan_id' => ['لا يوجد اشتراك حالي؛ حدّد خطة للتجديد.'],
                ]);
            }
            $plan = Plan::query()->findOrFail($current->plan_id);
        }

        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')
                ?->store("payment-proofs/{$tenant->ulid}", 'local');
        }

        $created = $action->handle(
            tenant: $tenant,
            requester: $user,
            plan: $plan,
            type: SubscriptionRequestType::Renewal,
            payment: [
                'payment_method' => $request->input('payment_method'),
                'payment_reference' => $request->input('payment_reference'),
                'payment_proof_path' => $proofPath,
                'customer_note' => $request->input('customer_note'),
            ],
        );

        return ApiResponse::success(
            ['subscription_request' => SubscriptionRequestResource::make($created)],
            201,
        );
    }
}
