<?php

declare(strict_types=1);

namespace App\Domain\Messaging\Actions;

use App\Domain\Messaging\Jobs\ProcessOutboxMessage;
use App\Domain\Messaging\Models\Message;
use App\Domain\Messaging\Models\OutboxMessage;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Usage\Services\UsageMeter;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

final class PersistAcceptedMessage
{
    public function __construct(
        private readonly UsageMeter $usageMeter,
    ) {}

    /**
     * Persist the message, reserve quota, and write the outbox row in one transaction.
     *
     * @param  callable(): Message  $factory
     */
    public function handle(
        Tenant $tenant,
        Subscription $subscription,
        callable $factory,
        ?CarbonInterface $availableAt = null,
    ): Message {
        $result = DB::transaction(function () use ($tenant, $subscription, $factory, $availableAt): array {
            $message = $factory();
            $this->usageMeter->reserve($tenant, $subscription, $message);

            $outbox = OutboxMessage::query()->create([
                'aggregate_type' => 'message',
                'aggregate_id' => (string) $message->ulid,
                'event_type' => 'message.accepted',
                'payload' => ['message_ulid' => $message->ulid],
                'status' => OutboxMessage::STATUS_PENDING,
                'available_at' => $availableAt ?? now(),
            ]);

            return ['message' => $message, 'outbox_id' => (int) $outbox->id];
        });

        if ($availableAt === null || $availableAt->lte(now())) {
            ProcessOutboxMessage::dispatchSync($result['outbox_id']);
        }

        return $result['message'];
    }
}
