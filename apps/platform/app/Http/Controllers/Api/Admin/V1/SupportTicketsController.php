<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Support\Actions\AdminReplySupportTicket;
use App\Domain\Support\Actions\AdminUpdateSupportTicket;
use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class SupportTicketsController extends Controller
{
    public function show(Request $request, string $ticketUlid): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        $ticket = SupportTicket::query()->where('ulid', $ticketUlid)->firstOrFail();

        return ApiResponse::success([
            'ticket' => SupportTicketResource::make($ticket, true),
        ]);
    }

    public function reply(
        Request $request,
        string $ticketUlid,
        AdminReplySupportTicket $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:8000'],
        ]);

        $ticket = SupportTicket::query()->where('ulid', $ticketUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $message = $action->handle(
            actor: $actor,
            ticket: $ticket,
            body: $validated['body'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success([
            'message' => [
                'id' => $message->id,
                'body' => $message->body,
                'is_staff' => true,
                'created_at' => $message->created_at?->toIso8601String(),
            ],
            'ticket' => SupportTicketResource::make($ticket->fresh(['tenant', 'user.profile', 'messages.user.profile']), true),
        ], 201);
    }

    public function update(
        Request $request,
        string $ticketUlid,
        AdminUpdateSupportTicket $action,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:open,in_progress,waiting_customer,closed'],
            'priority' => ['sometimes', 'string', 'in:low,normal,high,urgent'],
        ]);

        $ticket = SupportTicket::query()->where('ulid', $ticketUlid)->firstOrFail();

        /** @var User $actor */
        $actor = $request->user();

        $updated = $action->handle(
            actor: $actor,
            ticket: $ticket,
            data: $validated,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $this->requestId($request),
        );

        return ApiResponse::success([
            'ticket' => SupportTicketResource::make($updated, true),
        ]);
    }

    private function requestId(Request $request): string
    {
        $existing = $request->attributes->get('request_id')
            ?? $request->headers->get('X-Request-Id');

        if (is_string($existing) && $existing !== '') {
            return $existing;
        }

        return 'req_'.Str::lower((string) Str::ulid());
    }
}
