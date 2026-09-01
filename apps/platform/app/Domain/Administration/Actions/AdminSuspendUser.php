<?php

declare(strict_types=1);

namespace App\Domain\Administration\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\AuthSession;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Enums\TenantStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminSuspendUser
{
    public function handle(
        User $actor,
        User $target,
        ?string $reason = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): User {
        if ($target->status === UserStatus::Suspended) {
            throw ValidationException::withMessages([
                'user' => ['المستخدم معلّق مسبقاً.'],
            ]);
        }

        if ($target->id === $actor->id) {
            throw ValidationException::withMessages([
                'user' => ['لا يمكن تعليق حسابك الخاص.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $target, $reason, $ip, $userAgent, $requestId): User {
            $before = ['status' => $target->status->value];

            $target->forceFill([
                'status' => UserStatus::Suspended,
            ])->save();

            AuthSession::query()
                ->where('user_id', $target->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $target->ownedTenants()->update(['status' => TenantStatus::Suspended->value]);

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $target->primaryTenant()?->id,
                'action' => 'user.suspended',
                'subject_type' => User::class,
                'subject_ulid' => $target->ulid,
                'before' => $before,
                'after' => [
                    'status' => UserStatus::Suspended->value,
                    'reason' => $reason,
                ],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $target->fresh(['profile']);
        });
    }
}
