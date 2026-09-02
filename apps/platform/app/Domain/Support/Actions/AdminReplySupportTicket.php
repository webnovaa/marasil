<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\Support\Models\SupportTicketMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminReplySupportTicket
{
    public function handle(
        User $actor,
        SupportTicket $ticket,
        string $body,
        ?string $ip = null,
        ?string $userAgent = null,
        ?string $requestId = null,
    ): SupportTicketMessage {
        $body = trim($body);

        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => ['نص الرد مطلوب.'],
            ]);
        }

        if ($ticket->status === 'closed') {
            throw ValidationException::withMessages([
                'ticket' => ['التذكرة مغلقة.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $ticket, $body, $ip, $userAgent, $requestId): SupportTicketMessage {
            $message = SupportTicketMessage::query()->create([
                'support_ticket_id' => $ticket->id,
                'user_id' => $actor->id,
                'body' => $body,
                'is_staff' => true,
            ]);

            if ($ticket->status === 'open') {
                $ticket->forceFill(['status' => 'in_progress'])->save();
            }

            AuditLog::query()->create([
                'actor_user_id' => $actor->id,
                'tenant_id' => $ticket->tenant_id,
                'action' => 'support_ticket.replied',
                'subject_type' => SupportTicket::class,
                'subject_ulid' => $ticket->ulid,
                'after' => ['message_id' => $message->id],
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'request_id' => $requestId,
            ]);

            return $message->load('user.profile');
        });
    }
}
