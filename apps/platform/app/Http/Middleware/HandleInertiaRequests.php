<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Services\NotificationService;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Support\Auth\HomeDashboard;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $user?->loadMissing(['profile', 'roles']);

        return [
            ...parent::share($request),
            'appName' => config('app.name', 'Marasil'),
            'locale' => app()->getLocale(),
            'dir' => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',
            'unreadNotifications' => $user instanceof User
                ? app(NotificationService::class)->unreadCount($user)
                : 0,
            'recentNotifications' => fn () => $user instanceof User
                ? \App\Domain\Notifications\Models\InAppNotification::query()
                    ->where('user_id', $user->id)
                    ->orderByDesc('id')
                    ->limit(6)
                    ->get()
                    ->map(fn ($n) => [
                        'id' => $n->ulid,
                        'type' => $n->type,
                        'title' => $n->title,
                        'body' => $n->body,
                        'read_at' => $n->read_at?->toIso8601String(),
                        'created_at' => $n->created_at?->toIso8601String(),
                    ])
                : [],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->ulid ?? null,
                    'phone_e164' => $user->phone_e164 ?? null,
                    'status' => $user->status->value ?? $user->status ?? null,
                    'full_name' => $user->profile->full_name ?? null,
                    'roles' => method_exists($user, 'roles')
                        ? $user->roles->pluck('name')->values()->all()
                        : [],
                    'permissions' => $user->permissionNames(),
                    'can_access_admin' => $user->canAccessAdminPanel(),
                    'can_access_tenant' => $user->canAccessTenantArea(),
                    'preferred_locale' => $user->preferred_locale ?? 'ar',
                    'home_path' => $user->homeDashboardPath(),
                ] : null,
            ],
            'subscription' => fn () => $this->shareSubscription($user instanceof User ? $user : null),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function shareSubscription(?User $user): ?array
    {
        if ($user === null || ! $user->canAccessTenantArea()) {
            return null;
        }

        $tenant = $user->primaryTenant();

        if ($tenant === null) {
            return null;
        }

        $gate = app(SubscriptionGate::class);
        $current = $gate->currentSubscription($tenant);
        $current?->loadMissing('plan');

        return [
            'is_usable' => $gate->forTenant($tenant),
            'has_pending_request' => HomeDashboard::hasPendingSubscriptionRequest($tenant),
            'plan_name' => $current?->plan_name ?? $current?->plan?->name,
            'status' => $current?->status?->value,
            'ends_at' => $current?->ends_at?->toIso8601String(),
            'max_devices' => $current?->max_devices,
            'monthly_message_limit' => $current?->monthly_message_limit,
        ];
    }
}
