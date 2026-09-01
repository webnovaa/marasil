<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use Illuminate\Console\Command;

final class ReconcileSubscriptions extends Command
{
    protected $signature = 'subscriptions:reconcile';

    protected $description = 'Move subscriptions into grace, expired, or cancelled-ended states.';

    public function handle(): int
    {
        $now = now();

        $grace = Subscription::query()
            ->whereIn('status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trialing->value,
                SubscriptionStatus::Expiring->value,
                SubscriptionStatus::Cancelled->value,
            ])
            ->where('ends_at', '<', $now)
            ->where('grace_ends_at', '>=', $now)
            ->update(['status' => SubscriptionStatus::GracePeriod->value]);

        $expired = Subscription::query()
            ->whereNotIn('status', [
                SubscriptionStatus::Expired->value,
                SubscriptionStatus::Suspended->value,
            ])
            ->where(function ($query) use ($now): void {
                $query->where(function ($inner) use ($now): void {
                    $inner->whereNotNull('grace_ends_at')
                        ->where('grace_ends_at', '<', $now);
                })->orWhere(function ($inner) use ($now): void {
                    $inner->whereNull('grace_ends_at')
                        ->where('ends_at', '<', $now);
                });
            })
            ->update(['status' => SubscriptionStatus::Expired->value]);

        $this->info("Marked {$grace} subscription(s) as grace_period and {$expired} as expired.");

        return self::SUCCESS;
    }
}
