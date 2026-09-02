<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Support\Models\SupportTicket;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminUpdateSupportTicket
{
    /**
     * @param  array{status?: string|null, priority?: string|null}  $data
     */
    public function handle(
        User $actor,
        SupportTicket $ticket,
        array $data,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): SupportTicket {
        $allowedStatuses = ['open', 'in_progress', 'waiting_customer', 'closed'];
        $allowedPriorities = ['low', 'normal', 'high', 'urgent'];

        if (isset($data['status']) && ! in_array($data['status'], $allowedStatuses, true)) {
            throw ValidationException::withMessages(['status' => ['حالة غير صالحة.']]);
        }

        if (isset($data['priority']) && ! in_array($data['priority'], $allowedPriorities, true)) {
            throw ValidationException::withMessages(['priority' => ['أولوية غير صالحة.']]);
        }

        return DB::transaction(function () use ($actor, $ticket, $data, $ip, $userAgent, $requestId): SupportTicket {
            $before = ['status' => $ticket->status, 'priority' => $ticket->priority];

            $ticket->fill(array_filter([
                'status' => $data['status'] ?? null,
                'priority' => $data['priority'] ?? null,
            ], fn ($v) => $v !== null));
            $ticket->save();

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $ticket->tenant_id,
                'action' => 'support_ticket.updated',
                'subject_type' => SupportTicket::class,
                'subject_ulid' => $ticket->ulid,
                'before' => $before,
                'after' => ['status' => $ticket->status, 'priority' => $ticket->priority],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $ticket->fresh(['tenant', 'user.profile']);
        });
    }
}
