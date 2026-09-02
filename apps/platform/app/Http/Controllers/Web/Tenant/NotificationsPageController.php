<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Models\InAppNotification;
use App\Domain\Notifications\Models\NotificationPreference;
use App\Domain\Notifications\Services\NotificationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class NotificationsPageController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $notifications = InAppNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn (InAppNotification $row): array => [
                'id' => $row->ulid,
                'type' => $row->type,
                'title' => $row->title,
                'body' => $row->body,
                'read_at' => $row->read_at?->toIso8601String(),
                'created_at' => $row->created_at?->toIso8601String(),
            ]);

        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['in_app_enabled' => true, 'security_critical_enabled' => true],
        );

        return Inertia::render('Tenant/Notifications/Index', [
            'notifications' => $notifications,
            'preferences' => [
                'in_app_enabled' => $prefs->in_app_enabled,
                'usage_alerts_enabled' => $prefs->usage_alerts_enabled,
                'device_alerts_enabled' => $prefs->device_alerts_enabled,
            ],
        ]);
    }

    public function markRead(Request $request, NotificationService $service, string $ulid): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $service->markRead($user, $ulid);

        return back();
    }

    public function markAllRead(Request $request, NotificationService $service): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $service->markAllRead($user);

        return back();
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'in_app_enabled' => ['sometimes', 'boolean'],
            'usage_alerts_enabled' => ['sometimes', 'boolean'],
            'device_alerts_enabled' => ['sometimes', 'boolean'],
        ]);

        NotificationPreference::query()->updateOrCreate(
            ['user_id' => $user->id],
            $data + ['security_critical_enabled' => true],
        );

        return back()->with('success', __('messages.flash.preferences_saved'));
    }
}
