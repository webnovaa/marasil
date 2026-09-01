<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\Support\Models\SupportTicketMessage;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SupportPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $tickets = $tenant
            ? SupportTicket::query()
                ->where('tenant_id', $tenant->id)
                ->orderByDesc('id')
                ->limit(50)
                ->get()
                ->map(fn (SupportTicket $ticket): array => [
                    'id' => $ticket->ulid,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at?->toIso8601String(),
                ])
            : [];

        return Inertia::render('Tenant/Support/Index', [
            'tickets' => $tickets,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $data = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'body' => ['required', 'string', 'max:5000'],
            'priority' => ['sometimes', 'in:low,normal,high'],
        ]);

        $ticket = SupportTicket::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'subject' => $data['subject'],
            'status' => 'open',
            'priority' => $data['priority'] ?? 'normal',
        ]);

        SupportTicketMessage::query()->create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $data['body'],
            'is_staff' => false,
        ]);

        return back()->with('success', 'تم فتح تذكرة الدعم.');
    }
}
