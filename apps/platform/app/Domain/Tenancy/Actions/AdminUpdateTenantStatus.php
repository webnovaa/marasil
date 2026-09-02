<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Enums\TenantStatus;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminUpdateTenantStatus
{
    public function handle(
        User $actor,
        Tenant $tenant,
        TenantStatus $status,
        ?string $reason = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): Tenant {
        if ($tenant->slug === (string) config('platform.tenant_slug', '_platform')) {
            throw ValidationException::withMessages([
                'tenant' => ['لا يمكن تعديل حالة حساب المنصة الداخلي.'],
            ]);
        }

        if ($tenant->status === $status) {
            throw ValidationException::withMessages([
                'status' => ['الحساب في هذه الحالة بالفعل.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $tenant, $status, $reason, $ip, $userAgent, $requestId): Tenant {
            $before = $tenant->status->value;

            $tenant->forceFill(['status' => $status])->save();

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $tenant->id,
                'action' => 'tenant.status_updated',
                'subject_type' => Tenant::class,
                'subject_ulid' => $tenant->ulid,
                'before' => ['status' => $before],
                'after' => ['status' => $status->value, 'reason' => $reason],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $tenant->fresh(['owner.profile']);
        });
    }
}
