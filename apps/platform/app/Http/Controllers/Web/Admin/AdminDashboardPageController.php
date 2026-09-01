<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class AdminDashboardPageController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();
        abort_unless($user instanceof User && $user->canAccessAdminPanel(), 403);

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => [
                [
                    'title' => 'حسابات بانتظار الموافقة',
                    'value' => User::query()->where('status', UserStatus::PendingApproval)->count(),
                    'description' => 'إجمالي الطلبات المعلّقة',
                    'tone' => 'users',
                ],
                [
                    'title' => 'طلبات اشتراك معلّقة',
                    'value' => SubscriptionRequest::query()
                        ->where('status', SubscriptionRequestStatus::Pending)
                        ->count(),
                    'description' => 'بانتظار مراجعة الإدارة',
                    'tone' => 'billing',
                ],
                [
                    'title' => 'خطط نشطة',
                    'value' => Plan::query()->where('is_active', true)->count(),
                    'description' => 'متاحة للعملاء',
                    'tone' => 'plans',
                ],
                [
                    'title' => 'أجهزة متصلة',
                    'value' => Device::query()->where('status', DeviceStatus::Connected)->count(),
                    'description' => 'نشطة على المنصة',
                    'tone' => 'devices',
                ],
            ],
        ]);
    }
}
