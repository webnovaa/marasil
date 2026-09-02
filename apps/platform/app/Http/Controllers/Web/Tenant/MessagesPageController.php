<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Models\Message;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class MessagesPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $status = (string) $request->query('status', '');
        $search = trim((string) $request->query('search', ''));

        $query = $tenant
            ? Message::query()->where('tenant_id', $tenant->id)->with('device')->orderByDesc('id')
            : null;

        if ($query !== null && $status !== '') {
            $query->where('status', $status);
        }

        if ($query !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('recipient_e164', 'like', '%'.$search.'%')
                    ->orWhere('ulid', 'like', '%'.$search.'%');
            });
        }

        $messages = $query?->paginate(25)->withQueryString();

        return Inertia::render('Tenant/Messages/Index', [
            'messages' => $messages
                ? $messages->getCollection()->map(fn (Message $m) => MessageResource::make($m))->values()
                : [],
            'filters' => ['status' => $status, 'search' => $search],
            'pagination' => $messages ? [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ] : null,
        ]);
    }
}
