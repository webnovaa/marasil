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

final class MessagesShowPageController extends Controller
{
    public function __invoke(Request $request, string $messageUlid): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $message = Message::query()
            ->where('ulid', $messageUlid)
            ->where('tenant_id', $tenant->id)
            ->with(['device', 'statusEvents'])
            ->firstOrFail();

        return Inertia::render('Tenant/Messages/Show', [
            'message' => array_merge(MessageResource::make($message), [
                'error_message' => $message->error_message,
                'delivered_at' => $message->delivered_at?->toIso8601String(),
                'read_at' => $message->read_at?->toIso8601String(),
                'device_name' => $message->device?->name,
                'status_events' => $message->statusEvents->map(fn ($e) => [
                    'status' => $e->status,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->values()->all(),
            ]),
        ]);
    }
}
