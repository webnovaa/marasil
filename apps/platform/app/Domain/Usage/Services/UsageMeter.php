<?php

declare(strict_types=1);

namespace App\Domain\Usage\Services;

use App\Domain\Messaging\Models\Message;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Usage\Models\UsageLedgerEntry;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

final class UsageMeter
{
    public function used(Tenant $tenant, ?string $periodStart = null): int
    {
        $periodStart ??= now()->startOfMonth()->toDateString();

        return (int) UsageLedgerEntry::query()
            ->where('tenant_id', $tenant->id)
            ->where('period_type', 'monthly')
            ->whereDate('period_start', $periodStart)
            ->whereIn('state', ['reserved', 'committed'])
            ->sum('quantity');
    }

    public function reserve(Tenant $tenant, Subscription $subscription, Message $message): void
    {
        $periodStart = now()->startOfMonth()->toDateString();

        $callback = function () use ($tenant, $subscription, $message, $periodStart): void {
            Tenant::query()->whereKey($tenant->id)->lockForUpdate()->first();

            $used = $this->used($tenant, $periodStart);
            $limit = (int) $subscription->monthly_message_limit;

            if ($limit >= 0 && $used >= $limit) {
                throw new HttpResponseException(
                    ApiResponse::error('MESSAGE_QUOTA_EXCEEDED', 'Monthly message quota reached.', 403)
                );
            }

            $dailyLimit = (int) $subscription->daily_message_limit_per_device;
            if ($dailyLimit > 0 && $message->device_id !== null) {
                $usedToday = Message::query()
                    ->where('device_id', $message->device_id)
                    ->whereDate('created_at', now()->toDateString())
                    ->where('id', '!=', $message->id)
                    ->count();

                if ($usedToday >= $dailyLimit) {
                    throw new HttpResponseException(
                        ApiResponse::error('DAILY_DEVICE_QUOTA_EXCEEDED', 'Daily message limit for this device reached.', 403)
                    );
                }
            }

            UsageLedgerEntry::query()->create([
                'tenant_id' => $tenant->id,
                'message_id' => $message->id,
                'state' => 'reserved',
                'quantity' => 1,
                'period_type' => 'monthly',
                'period_start' => $periodStart,
            ]);
        };

        if (DB::transactionLevel() > 0) {
            $callback();

            return;
        }

        DB::transaction($callback);
    }

    public function release(Message $message): void
    {
        UsageLedgerEntry::query()
            ->where('message_id', $message->id)
            ->where('state', 'reserved')
            ->update(['state' => 'released']);
    }

    public function commit(Message $message): void
    {
        UsageLedgerEntry::query()
            ->where('message_id', $message->id)
            ->where('state', 'reserved')
            ->update(['state' => 'committed']);
    }
}
