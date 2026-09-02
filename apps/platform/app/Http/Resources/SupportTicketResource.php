<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Support\Models\SupportTicket;
use App\Domain\Support\Models\SupportTicketMessage;

final class SupportTicketResource
{
    /**
     * @return array<string, mixed>
     */
    public static function make(SupportTicket $ticket, bool $withMessages = false): array
    {
        $ticket->loadMissing(['tenant', 'user.profile']);

        if ($withMessages) {
            $ticket->loadMissing(['messages.user.profile']);
        }

        return [
            'id' => $ticket->ulid,
            'subject' => $ticket->subject,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'created_at' => $ticket->created_at?->toIso8601String(),
            'updated_at' => $ticket->updated_at?->toIso8601String(),
            'tenant' => $ticket->tenant ? [
                'id' => $ticket->tenant->ulid,
                'name' => $ticket->tenant->name,
            ] : null,
            'user' => $ticket->user ? [
                'id' => $ticket->user->ulid,
                'full_name' => $ticket->user->profile?->full_name,
                'phone_e164' => $ticket->user->phone_e164,
            ] : null,
            'messages' => $withMessages
                ? $ticket->messages->map(fn (SupportTicketMessage $m) => [
                    'id' => $m->id,
                    'body' => $m->body,
                    'is_staff' => (bool) $m->is_staff,
                    'created_at' => $m->created_at?->toIso8601String(),
                    'author' => $m->user ? [
                        'full_name' => $m->user->profile?->full_name,
                        'phone_e164' => $m->user->phone_e164,
                    ] : null,
                ])->values()->all()
                : null,
        ];
    }
}
