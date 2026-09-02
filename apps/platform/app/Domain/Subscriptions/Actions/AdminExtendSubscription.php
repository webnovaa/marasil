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

final class AdminExtendSubscription
{
    public function handle(
        User $actor,
        Subscription $subscription,
        int $days,
        ?string $reason = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): Subscription {
        if ($days < 1 || $days > 365) {
            throw ValidationException::withMessages([
                'days' => ['عدد الأيام يجب أن يكون بين 1 و 365.'],
            ]);
        }

        $allowed = [
            SubscriptionStatus::Active,
            SubscriptionStatus::Expiring,
            SubscriptionStatus::GracePeriod,
            SubscriptionStatus::PastDue,
        ];

        if (! in_array($subscription->status, $allowed, true)) {
            throw ValidationException::withMessages([
                'subscription' => ['لا يمكن تمديد الاشتراك في حالته الحالية.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $subscription, $days, $reason, $ip, $userAgent, $requestId): Subscription {
            $from = $subscription->status;
            $previousEndsAt = $subscription->ends_at?->toIso8601String();
            $newEndsAt = ($subscription->ends_at ?? now())->copy()->addDays($days);
            $newGraceEndsAt = ($subscription->grace_ends_at ?? $newEndsAt)->copy()->addDays($days);

            $subscription->forceFill([
                'ends_at' => $newEndsAt,
                'grace_ends_at' => $newGraceEndsAt,
                'status' => SubscriptionStatus::Active,
            ])->save();

            SubscriptionEvent::query()->create([
                'subscription_id' => $subscription->id,
                'actor_user_id' => $actor->id,
                'event_type' => 'subscription.extended',
                'from_status' => $from->value,
                'to_status' => SubscriptionStatus::Active->value,
                'details' => [
                    'days' => $days,
                    'reason' => $reason,
                    'previous_ends_at' => $previousEndsAt,
                    'new_ends_at' => $newEndsAt->toIso8601String(),
                ],
            ]);

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $subscription->tenant_id,
                'action' => 'subscription.extended',
                'subject_type' => Subscription::class,
                'subject_ulid' => $subscription->ulid,
                'before' => ['ends_at' => $previousEndsAt, 'status' => $from->value],
                'after' => ['ends_at' => $newEndsAt->toIso8601String(), 'days' => $days, 'reason' => $reason],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $subscription->fresh(['plan', 'tenant']);
        });
    }
}
