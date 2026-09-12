<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Actions;

use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Models\Payment;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionRequestType;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CreateSubscriptionRequest
{
    /**
     * @param  array{
     *     billing_cycle?: string|null,
     *     payment_method?: string|null,
     *     payment_reference?: string|null,
     *     payment_proof_path?: string|null,
     *     customer_note?: string|null,
     * }  $payment
     */
    public function handle(
        Tenant $tenant,
        User $requester,
        Plan $plan,
        SubscriptionRequestType $type = SubscriptionRequestType::New,
        array $payment = [],
    ): SubscriptionRequest {
        if (! $plan->is_active) {
            throw ValidationException::withMessages([
                'plan_id' => ['هذه الخطة غير متاحة حالياً.'],
            ]);
        }

        $pendingExists = SubscriptionRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', SubscriptionRequestStatus::Pending)
            ->exists();

        if ($pendingExists) {
            throw ValidationException::withMessages([
                'subscription_request' => ['لديك طلب اشتراك قيد المراجعة بالفعل.'],
            ]);
        }

        $billingCycle = ($payment['billing_cycle'] ?? 'monthly') === 'yearly' ? 'yearly' : 'monthly';
        $amountMinor = $plan->price_minor;

        if ($billingCycle === 'yearly' && $plan->price_minor > 0) {
            $discount = (int) ($plan->annual_discount_percent ?? 0);
            $amountMinor = (int) round($plan->price_minor * 12 * (1 - $discount / 100));
        }

        return DB::transaction(function () use ($tenant, $requester, $plan, $type, $payment, $billingCycle, $amountMinor): SubscriptionRequest {
            $request = SubscriptionRequest::query()->create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'requested_by' => $requester->id,
                'type' => $type,
                'billing_cycle' => $billingCycle,
                'amount_minor' => $amountMinor,
                'status' => SubscriptionRequestStatus::Pending,
                'payment_method' => $payment['payment_method'] ?? null,
                'payment_reference' => $payment['payment_reference'] ?? null,
                'payment_proof_path' => $payment['payment_proof_path'] ?? null,
                'customer_note' => $payment['customer_note'] ?? null,
            ]);

            if (($payment['payment_proof_path'] ?? null) !== null || ($payment['payment_reference'] ?? null) !== null) {
                Payment::query()->create([
                    'tenant_id' => $tenant->id,
                    'subscription_request_id' => $request->id,
                    'amount_minor' => $amountMinor,
                    'currency' => $plan->currency,
                    'provider' => $payment['payment_method'] ?? 'manual',
                    'provider_reference' => $payment['payment_reference'] ?? null,
                    'status' => PaymentStatus::Pending,
                    'proof_path' => $payment['payment_proof_path'] ?? null,
                    'metadata' => [
                        'source' => 'subscription_request',
                        'billing_cycle' => $billingCycle,
                    ],
                ]);
            }

            if (! $plan->requiresAdminApproval()) {
                app(AdminApproveSubscriptionRequest::class)->handle(
                    actor: $requester,
                    request: $request,
                    adminNote: 'تفعيل تلقائي — خطة مجانية',
                );
            }

            return $request->fresh(['plan', 'tenant']);
        });
    }
}
