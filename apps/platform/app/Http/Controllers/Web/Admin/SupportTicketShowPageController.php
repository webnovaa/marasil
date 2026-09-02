<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketShowPageController extends Controller
{
    public function __invoke(Request $request, string $ticketUlid): Response
    {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        $ticket = SupportTicket::query()
            ->where('ulid', $ticketUlid)
            ->with(['tenant', 'user.profile', 'messages.user.profile'])
            ->firstOrFail();

        return Inertia::render('Admin/Support/Show', [
            'ticket' => SupportTicketResource::make($ticket, true),
        ]);
    }
}
