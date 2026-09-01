<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Http\Middleware\Concerns\RespondsToWebOrApi;
use App\Support\ApiResponse;
use App\Support\Auth\HomeDashboard;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureActiveSubscription
{
    use RespondsToWebOrApi;

    public function __construct(
        private readonly SubscriptionGate $gate,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $this->deny($request, 'UNAUTHENTICATED', 'Authentication required.', 401);
        }

        $tenant = $user->primaryTenant();

        if ($this->gate->forTenant($tenant)) {
            return $next($request);
        }

        $hadSubscription = $tenant !== null
            && Subscription::query()
                ->where('tenant_id', $tenant->id)
                ->exists();

        $code = $hadSubscription ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_REQUIRED';

        if ($this->wantsJsonResponse($request)) {
            return ApiResponse::error(
                $code,
                $code === 'SUBSCRIPTION_REQUIRED'
                    ? 'An active subscription is required.'
                    : 'Subscription has expired.',
                403,
            );
        }

        $redirectPath = $hadSubscription
            ? HomeDashboard::SUBSCRIPTION_PATH
            : HomeDashboard::ONBOARDING_PATH;

        $message = $code === 'SUBSCRIPTION_REQUIRED'
            ? 'لا يوجد اشتراك فعّال. اختر خطة اشتراك للمتابعة.'
            : 'انتهى اشتراكك. جدّد اشتراكك أو أرسل طلب تجديد.';

        if (HomeDashboard::hasPendingSubscriptionRequest($tenant)) {
            $redirectPath = HomeDashboard::SUBSCRIPTION_PATH;
            $message = 'طلب اشتراكك قيد المراجعة. يمكنك متابعة الحالة من صفحة الاشتراك.';
        }

        return redirect($redirectPath)->with('error', $message);
    }
}
