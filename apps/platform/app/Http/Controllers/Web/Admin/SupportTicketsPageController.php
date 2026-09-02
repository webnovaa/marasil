<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketsPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        $status = (string) $request->query('status', '');
        $search = trim((string) $request->query('search', ''));

        $query = SupportTicket::query()
            ->with(['tenant', 'user.profile'])
            ->orderByDesc('id');

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('subject', 'like', '%'.$search.'%')
                    ->orWhereHas('tenant', fn ($t) => $t->where('name', 'like', '%'.$search.'%'));
            });
        }

        $tickets = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Support/Index', [
            'tickets' => $tickets->getCollection()->map(fn (SupportTicket $t) => SupportTicketResource::make($t))->values(),
            'filters' => ['search' => $search, 'status' => $status],
            'statusOptions' => ['open', 'in_progress', 'waiting_customer', 'closed'],
            'pagination' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }
}
