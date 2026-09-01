<?php

declare(strict_types=1);

namespace App\Domain\Subscriptions\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminRejectSubscriptionRequest
{
    public function handle(
        User $actor,
        SubscriptionRequest $request,
        string $reason,
        ?string $adminNote = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): SubscriptionRequest {
        if ($request->status !== SubscriptionRequestStatus::Pending) {
            throw ValidationException::withMessages([
                'subscription_request' => ['لا يمكن رفض هذا الطلب في حالته الحالية.'],
            ]);
        }

        return DB::transaction(function () use (
            $actor,
            $request,
            $reason,
            $adminNote,
            $ip,
            $userAgent,
            $requestId,
        ): SubscriptionRequest {
            $before = ['status' => $request->status->value];

            $request->forceFill([
                'status' => SubscriptionRequestStatus::Rejected,
                'rejection_reason' => $reason,
                'admin_note' => $adminNote,
                'reviewed_by' => $actor->id,
                'reviewed_at' => now(),
            ])->save();

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $request->tenant_id,
                'action' => 'subscription_request.rejected',
                'subject_type' => SubscriptionRequest::class,
                'subject_ulid' => $request->ulid,
                'before' => $before,
                'after' => [
                    'status' => SubscriptionRequestStatus::Rejected->value,
                    'rejection_reason' => $reason,
                ],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $request->fresh(['plan', 'tenant', 'requester']);
        });
    }
}
