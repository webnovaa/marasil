<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Models\SubscriptionEvent;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminApproveSubscriptionRequest
{
    public function handle(
        User $actor,
        SubscriptionRequest $request,
        ?string $adminNote = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): Subscription {
        if ($request->status !== SubscriptionRequestStatus::Pending) {
            throw ValidationException::withMessages([
                'subscription_request' => ['لا يمكن الموافقة على هذا الطلب في حالته الحالية.'],
            ]);
        }

        $request->loadMissing('plan');

        $plan = $request->plan;
        if ($plan === null || ! $plan->is_active) {
            throw ValidationException::withMessages([
                'plan_id' => ['الخطة المرتبطة غير متاحة.'],
            ]);
        }

        $graceDays = (int) config('subscriptions.grace_days', 3);
        $durationDays = max(1, (int) ($plan->duration_days ?? 30));

        return DB::transaction(function () use (
            $actor,
            $request,
            $adminNote,
            $ip,
            $userAgent,
            $requestId,
            $plan,
            $graceDays,
            $durationDays,
        ): Subscription {
            $startsAt = now();
            $endsAt = $startsAt->copy()->addDays($durationDays);
            $graceEndsAt = $endsAt->copy()->addDays($graceDays);

            // Free the unique active slot before inserting a new active subscription.
            Subscription::query()
                ->where('tenant_id', $request->tenant_id)
                ->where('status', SubscriptionStatus::Active)
                ->each(function (Subscription $existing) use ($actor, $startsAt): void {
                    $from = $existing->status;
                    $existing->forceFill([
                        'status' => SubscriptionStatus::Cancelled,
                    ])->save();

                    SubscriptionEvent::query()->create([
                        'subscription_id' => $existing->id,
                        'actor_user_id' => $actor->id,
                        'event_type' => 'subscription.superseded',
                        'from_status' => $from->value,
                        'to_status' => SubscriptionStatus::Cancelled->value,
                        'details' => [
                            'reason' => 'replaced_by_new_approval',
                            'at' => $startsAt->toIso8601String(),
                        ],
                    ]);
                });

            $snapshot = $plan->limitSnapshot();

            $subscription = Subscription::query()->create(array_merge($snapshot, [
                'tenant_id' => $request->tenant_id,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Active,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'grace_ends_at' => $graceEndsAt,
                'approved_by' => $actor->id,
                'auto_renew' => false,
            ]));

            $request->forceFill([
                'status' => SubscriptionRequestStatus::Approved,
                'admin_note' => $adminNote,
                'reviewed_by' => $actor->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ])->save();

            SubscriptionEvent::query()->create([
                'subscription_id' => $subscription->id,
                'actor_user_id' => $actor->id,
                'event_type' => 'subscription.activated',
                'from_status' => null,
                'to_status' => SubscriptionStatus::Active->value,
                'details' => [
                    'subscription_request_ulid' => $request->ulid,
                    'plan_slug' => $plan->slug,
                    'starts_at' => $startsAt->toIso8601String(),
                    'ends_at' => $endsAt->toIso8601String(),
                    'grace_ends_at' => $graceEndsAt->toIso8601String(),
                ],
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $request->tenant_id,
                'action' => 'subscription_request.approved',
                'subject_type' => SubscriptionRequest::class,
                'subject_ulid' => $request->ulid,
                'before' => ['status' => SubscriptionRequestStatus::Pending->value],
                'after' => [
                    'status' => SubscriptionRequestStatus::Approved->value,
                    'subscription_ulid' => $subscription->ulid,
                ],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $subscription->load(['plan', 'tenant']);
        });
    }
}
