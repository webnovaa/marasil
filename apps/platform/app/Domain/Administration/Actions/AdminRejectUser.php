<?php

declare(strict_types=1);

namespace App\Domain\Administration\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminRejectUser
{
    public function handle(
        User $actor,
        User $target,
        string $reason,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): User {
        if ($target->status !== UserStatus::PendingApproval) {
            throw ValidationException::withMessages([
                'user' => ['لا يمكن رفض هذا المستخدم في حالته الحالية.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $target, $reason, $ip, $userAgent, $requestId): User {
            $before = ['status' => $target->status->value];

            $target->forceFill([
                'status' => UserStatus::Rejected,
                'rejected_at' => now(),
                'rejected_by' => $actor->id,
                'rejection_reason' => $reason,
            ])->save();

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $target->primaryTenant()?->id,
                'action' => 'user.rejected',
                'subject_type' => User::class,
                'subject_ulid' => $target->ulid,
                'before' => $before,
                'after' => [
                    'status' => UserStatus::Rejected->value,
                    'rejection_reason' => $reason,
                ],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $target->fresh(['profile']);
        });
    }
}
