<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Models\SubscriptionEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminCancelSubscription
{
    public function handle(
        User $actor,
        Subscription $subscription,
        ?string $reason = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): Subscription {
        if ($subscription->status === SubscriptionStatus::Cancelled) {
            throw ValidationException::withMessages([
                'subscription' => ['الاشتراك ملغى مسبقاً.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $subscription, $reason, $ip, $userAgent, $requestId): Subscription {
            $from = $subscription->status;

            $subscription->forceFill([
                'status' => SubscriptionStatus::Cancelled,
            ])->save();

            SubscriptionEvent::query()->create([
                'subscription_id' => $subscription->id,
                'actor_user_id' => $actor->id,
                'event_type' => 'subscription.cancelled',
                'from_status' => $from->value,
                'to_status' => SubscriptionStatus::Cancelled->value,
                'details' => ['reason' => $reason],
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $subscription->tenant_id,
                'action' => 'subscription.cancelled',
                'subject_type' => Subscription::class,
                'subject_ulid' => $subscription->ulid,
                'before' => ['status' => $from->value],
                'after' => ['status' => SubscriptionStatus::Cancelled->value, 'reason' => $reason],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $subscription->fresh(['plan', 'tenant']);
        });
    }
}
