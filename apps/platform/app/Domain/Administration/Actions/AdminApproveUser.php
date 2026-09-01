<?php

declare(strict_types=1);

namespace App\Domain\Administration\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Enums\TenantStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminApproveUser
{
    public function handle(User $actor, User $target, ?string $ip = null, ?string $userAgent = null, ?string $requestId = null): User
    {
        if ($target->status !== UserStatus::PendingApproval) {
            throw ValidationException::withMessages([
                'user' => ['لا يمكن الموافقة على هذا المستخدم في حالته الحالية.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $target, $ip, $userAgent, $requestId): User {
            $before = ['status' => $target->status->value];

            $target->forceFill([
                'status' => UserStatus::Active,
                'approved_at' => now(),
                'approved_by' => $actor->id,
                'rejected_at' => null,
                'rejected_by' => null,
                'rejection_reason' => null,
            ])->save();

            $target->ownedTenants()
                ->where('status', TenantStatus::Pending->value)
                ->update(['status' => TenantStatus::Active->value]);

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $target->primaryTenant()?->id,
                'action' => 'user.approved',
                'subject_type' => User::class,
                'subject_ulid' => $target->ulid,
                'before' => $before,
                'after' => ['status' => UserStatus::Active->value],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $target->fresh(['profile', 'roles']);
        });
    }
}
