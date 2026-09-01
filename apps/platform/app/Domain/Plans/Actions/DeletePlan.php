<?php

declare(strict_types=1);

namespace App\Domain\Plans\Actions;

use App\Domain\Plans\Models\Plan;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use DomainException;

final class DeletePlan
{
    public function handle(Plan $plan): void
    {
        $hasActive = $plan->subscriptions()
            ->whereIn('status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Expiring->value,
                SubscriptionStatus::Scheduled->value,
            ])
            ->exists();

        if ($hasActive) {
            throw new DomainException('لا يمكن حذف خطة مرتبطة باشتراكات نشطة. عطّلها بدلًا من الحذف.');
        }

        $plan->delete();
    }
}
