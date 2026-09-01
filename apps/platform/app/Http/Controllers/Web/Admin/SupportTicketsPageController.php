<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketsPageController extends Controller
{
    public function __invoke(): Response
    {
        $tickets = SupportTicket::query()
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (SupportTicket $ticket): array => [
                'id' => $ticket->ulid,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
            ]);

        return Inertia::render('Admin/Support/Index', ['tickets' => $tickets]);
    }
}
