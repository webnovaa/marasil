<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Actions\CreateSubscriptionRequest;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\StoreSubscriptionRequestRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

final class SubscribePlanController extends Controller
{
    public function __invoke(
        StoreSubscriptionRequestRequest $request,
        CreateSubscriptionRequest $action,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            throw ValidationException::withMessages([
                'plan_id' => ['لا يوجد حساب شركة مرتبط بهذا المستخدم.'],
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

        if ($created->status === SubscriptionRequestStatus::Approved) {
            return redirect()
                ->route('tenant.dashboard')
                ->with('success', 'تم تفعيل خطتك بنجاح. يمكنك البدء الآن.');
        }

        return redirect()
            ->route('tenant.subscription')
            ->with('success', 'تم إرسال طلب الاشتراك. سيتم مراجعته من قبل الإدارة.');
    }
}
