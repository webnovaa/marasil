<?php

declare(strict_types=1);

namespace App\Domain\Campaigns\Jobs;

use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Campaigns\Models\CampaignRecipient;
use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Support\Spintax;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

final class ProcessCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600;

    public function __construct(
        public readonly int $campaignId,
    ) {}

    public function handle(AcceptTextMessage $acceptTextMessage): void
    {
        $campaign = Campaign::query()->with('tenant')->find($this->campaignId);
        if ($campaign === null || $campaign->status === 'paused') {
            return;
        }

        $campaign->update([
            'status' => 'running',
            'started_at' => $campaign->started_at ?? now(),
        ]);

        $tenant = $campaign->tenant;
        if ($tenant === null) {
            $campaign->update(['status' => 'failed']);
            return;
        }

        // Available devices for rotation
        $deviceIds = is_array($campaign->device_ids) ? $campaign->device_ids : [];
        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->when(count($deviceIds) > 0, fn ($q) => $q->whereIn('id', $deviceIds)->orWhereIn('ulid', $deviceIds))
            ->get();

        if ($devices->isEmpty()) {
            $campaign->update(['status' => 'failed']);
            return;
        }

        $deviceCount = $devices->count();
        $deviceIndex = 0;

        $recipients = CampaignRecipient::query()
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->cursor();

        foreach ($recipients as $recipient) {
            // Check if paused
            $fresh = $campaign->fresh();
            if ($fresh?->status === 'paused') {
                break;
            }

            // Pick device round-robin
            $device = $devices[$deviceIndex % $deviceCount];
            $deviceIndex++;

            // Process Spintax and personalized tags like {name}
            $template = $campaign->message_template;
            if (! empty($recipient->recipient_name)) {
                $template = str_replace(['{name}', '{الاسم}'], $recipient->recipient_name, $template);
            }
            $messageText = Spintax::process($template);

            try {
                $acceptTextMessage->handle(
                    tenant: $tenant,
                    data: [
                        'device_id' => $device->ulid,
                        'to' => $recipient->phone_e164,
                        'message' => $messageText,
                        'category' => 'marketing',
                    ],
                );

                $recipient->update([
                    'status' => 'sent',
                    'device_id' => $device->id,
                    'sent_at' => now(),
                ]);

                $campaign->increment('sent_count');
            } catch (Throwable $e) {
                $recipient->update([
                    'status' => 'failed',
                    'device_id' => $device->id,
                    'error_message' => $e->getMessage(),
                ]);

                $campaign->increment('failed_count');
            }

            // Anti-ban random delay
            $min = max(2, $campaign->min_delay_seconds);
            $max = max($min, $campaign->max_delay_seconds);
            $sleepSeconds = random_int($min, $max);
            sleep($sleepSeconds);
        }

        $pendingRemaining = CampaignRecipient::query()
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->exists();

        if (! $pendingRemaining) {
            $campaign->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }
    }
}
