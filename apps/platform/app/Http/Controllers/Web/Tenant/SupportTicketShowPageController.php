<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketShowPageController extends Controller
{
    public function __invoke(Request $request, string $ticketUlid): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $ticket = SupportTicket::query()
            ->where('ulid', $ticketUlid)
            ->where('tenant_id', $tenant->id)
            ->with(['messages.user.profile'])
            ->firstOrFail();

        return Inertia::render('Tenant/Support/Show', [
            'ticket' => SupportTicketResource::make($ticket, true),
        ]);
    }

    public function reply(Request $request, string $ticketUlid): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $ticket = SupportTicket::query()
            ->where('ulid', $ticketUlid)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        abort_if($ticket->status === 'closed', 422, 'التذكرة مغلقة.');

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $ticket->messages()->create([
            'user_id' => $user->id,
            'body' => $data['body'],
            'is_staff' => false,
        ]);

        if ($ticket->status === 'waiting_customer') {
            $ticket->update(['status' => 'in_progress']);
        }

        return back()->with('success', __('messages.flash.support_reply_sent'));
    }

    public function close(Request $request, string $ticketUlid): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $ticket = SupportTicket::query()
            ->where('ulid', $ticketUlid)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        $ticket->update(['status' => 'closed']);

        return redirect()->route('support.index')->with('success', __('messages.flash.support_ticket_closed'));
    }
}
