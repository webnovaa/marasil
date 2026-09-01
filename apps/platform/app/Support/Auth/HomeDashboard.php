<?php

declare(strict_types=1);

namespace App\Support\Auth;

use App\Domain\Identity\Models\User;
use App\Domain\Subscriptions\Enums\SubscriptionRequestStatus;
use App\Domain\Subscriptions\Models\SubscriptionRequest;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;

final class HomeDashboard
{
    public const ADMIN_PATH = '/admin';

    public const TENANT_PATH = '/tenant';

    public const SUBSCRIPTION_PATH = '/subscription';

    public const ONBOARDING_PATH = '/plans';

    public static function pathFor(User $user): string
    {
        if ($user->canAccessAdminPanel()) {
            return self::ADMIN_PATH;
        }

        if (! $user->canAccessTenantArea()) {
            return self::ONBOARDING_PATH;
        }

        $tenant = $user->primaryTenant();
        $gate = app(SubscriptionGate::class);

        if ($gate->forTenant($tenant)) {
            return self::TENANT_PATH;
        }

        if (self::hasPendingSubscriptionRequest($tenant)) {
            return self::SUBSCRIPTION_PATH;
        }

        return self::ONBOARDING_PATH;
    }

    public static function hasPendingSubscriptionRequest(?Tenant $tenant): bool
    {
        if ($tenant === null) {
            return false;
        }

        return SubscriptionRequest::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', SubscriptionRequestStatus::Pending)
            ->exists();
    }
}
