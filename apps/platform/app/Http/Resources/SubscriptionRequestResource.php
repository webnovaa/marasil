<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Subscriptions\Models\SubscriptionRequest;

final class SubscriptionRequestResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(SubscriptionRequest $request): array
    {
        $request->loadMissing(['plan', 'requester.profile']);

        return [
            'id' => $request->ulid,
            'type' => $request->type->value,
            'status' => $request->status->value,
            'billing_cycle' => $request->billing_cycle ?? 'monthly',
            'amount_minor' => $request->amount_minor ?? ($request->plan?->price_minor ?? 0),
            'formatted_amount' => number_format(($request->amount_minor ?? ($request->plan?->price_minor ?? 0)) / 100, 2),
            'currency' => $request->plan?->currency ?? 'USD',
            'payment_method' => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'has_payment_proof' => $request->payment_proof_path !== null,
            'customer_note' => $request->customer_note,
            'admin_note' => $request->admin_note,
            'rejection_reason' => $request->rejection_reason,
            'reviewed_at' => $request->reviewed_at?->toIso8601String(),
            'created_at' => $request->created_at?->toIso8601String(),
            'plan' => $request->plan ? PlanResource::make($request->plan) : null,
            'tenant' => $request->tenant ? [
                'id' => $request->tenant->ulid,
                'name' => $request->tenant->name,
                'slug' => $request->tenant->slug,
            ] : null,
            'requested_by' => $request->requester ? [
                'id' => $request->requester->ulid,
                'full_name' => $request->requester->profile?->full_name,
                'phone_e164' => $request->requester->phone_e164,
            ] : null,
        ];
    }
}
