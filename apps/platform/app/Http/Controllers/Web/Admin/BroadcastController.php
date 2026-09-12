<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Actions\BroadcastNotificationToUsers;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BroadcastController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $totalUsers = User::query()->where('status', UserStatus::Active)->count();

        $activeTenantIds = Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->pluck('tenant_id');

        $activeSubscribersCount = User::query()
            ->where('status', UserStatus::Active)
            ->whereHas('ownedTenants', function (Builder $query) use ($activeTenantIds) {
                $query->whereIn('id', $activeTenantIds);
            })
            ->count();

        $trialUsersCount = max(0, $totalUsers - $activeSubscribersCount);

        $recentBroadcasts = AuditLog::query()
            ->with('actor.profile')
            ->where('action', 'admin.broadcast_sent')
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'created_at' => $log->created_at?->toIso8601String(),
                'sender' => $log->actor?->profile?->full_name ?? $log->actor?->phone_e164 ?? 'مدير النظام',
                'title' => $log->after['title'] ?? '',
                'type' => $log->after['type'] ?? 'info',
                'target_audience' => $log->after['target_audience'] ?? 'all',
                'recipients_count' => $log->after['recipients_count'] ?? 0,
                'whatsapp_sent' => $log->after['whatsapp_sent'] ?? 0,
            ]);

        return Inertia::render('Admin/Broadcast/Index', [
            'stats' => [
                'total_users' => $totalUsers,
                'active_subscribers' => $activeSubscribersCount,
                'trial_users' => $trialUsersCount,
            ],
            'recent_broadcasts' => $recentBroadcasts,
        ]);
    }

    public function store(Request $request, BroadcastNotificationToUsers $action): RedirectResponse
    {
        $this->authorize('viewAny', User::class);

        /** @var User $actor */
        $actor = $request->user();

        $data = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:120'],
            'body' => ['required', 'string', 'min:5', 'max:2000'],
            'type' => ['required', 'string', 'in:info,warning,success,urgent'],
            'target_audience' => ['required', 'string', 'in:all,active_subscribers,trial_users'],
            'send_whatsapp' => ['sometimes', 'boolean'],
        ]);

        $result = $action->handle(
            actor: $actor,
            title: $data['title'],
            body: $data['body'],
            type: $data['type'],
            targetAudience: $data['target_audience'],
            sendWhatsApp: $request->boolean('send_whatsapp'),
        );

        $message = "تم بث الإشعار بنجاح إلى {$result['recipients_count']} مستخدم!";
        if ($result['whatsapp_sent_count'] > 0) {
            $message .= " (وتم إرسال {$result['whatsapp_sent_count']} رسالة عبر واتساب المنصة)";
        }

        return back()->with('success', $message);
    }
}
