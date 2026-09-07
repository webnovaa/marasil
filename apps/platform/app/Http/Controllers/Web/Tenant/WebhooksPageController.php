<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Models\NotificationPreference;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WebhooksPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('accessArea', Tenant::class);

        /** @var User $user */
        $user = $request->user();
        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'in_app_enabled' => true,
                'security_critical_enabled' => true,
                'usage_alerts_enabled' => true,
                'device_alerts_enabled' => true,
                'message_alerts_enabled' => true,
                'whatsapp_alerts_enabled' => true,
            ],
        );

        return Inertia::render('Tenant/Webhooks/Index', [
            'preferences' => [
                'message_alerts_enabled' => (bool) ($prefs->message_alerts_enabled ?? true),
                'whatsapp_alerts_enabled' => (bool) ($prefs->whatsapp_alerts_enabled ?? true),
                'in_app_enabled' => (bool) ($prefs->in_app_enabled ?? true),
            ],
            'owner_phone' => $user->phone_e164,
        ]);
    }
}
