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

        $messages = $tenant
            ? Message::query()
                ->where('tenant_id', $tenant->id)
                ->with('device')
                ->orderByDesc('id')
                ->limit(50)
                ->get()
                ->map(fn (Message $message): array => MessageResource::make($message))
                ->all()
            : [];

        return Inertia::render('Tenant/Messages/Index', [
            'messages' => $messages,
        ]);
    }
}
