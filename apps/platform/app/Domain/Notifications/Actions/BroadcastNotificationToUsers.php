<?php

declare(strict_types=1);

namespace App\Domain\Notifications\Actions;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Services\NotificationService;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Domain\Subscriptions\Enums\SubscriptionStatus;
use App\Domain\Subscriptions\Models\Subscription;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Throwable;

final class BroadcastNotificationToUsers
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly PlatformWhatsAppService $platformWhatsApp,
    ) {}

    /**
     * @return array{recipients_count: int, whatsapp_sent_count: int}
     */
    public function handle(
        User $actor,
        string $title,
        string $body,
        string $type = 'info',
        string $targetAudience = 'all',
        ?int $specificTenantId = null,
        bool $sendWhatsApp = false,
    ): array {
        $usersQuery = User::query()->where('status', UserStatus::Active);

        if ($targetAudience === 'active_subscribers') {
            $activeTenantIds = Subscription::query()
                ->where('status', SubscriptionStatus::Active)
                ->pluck('tenant_id');

            $usersQuery->whereHas('ownedTenants', function (Builder $query) use ($activeTenantIds) {
                $query->whereIn('id', $activeTenantIds);
            });
        } elseif ($targetAudience === 'trial_users') {
            $activeTenantIds = Subscription::query()
                ->where('status', SubscriptionStatus::Active)
                ->pluck('tenant_id');

            $usersQuery->whereDoesntHave('ownedTenants', function (Builder $query) use ($activeTenantIds) {
                $query->whereIn('id', $activeTenantIds);
            });
        } elseif ($targetAudience === 'specific_tenant' && $specificTenantId !== null) {
            $tenant = Tenant::query()->find($specificTenantId);
            if ($tenant !== null && $tenant->owner_user_id !== null) {
                $usersQuery->where('id', $tenant->owner_user_id);
            }
        }

        $recipients = $usersQuery->get();
        $recipientsCount = 0;
        $whatsappCount = 0;

        foreach ($recipients as $recipient) {
            $notificationType = 'broadcast.'.$type;

            $this->notificationService->notify(
                user: $recipient,
                type: $notificationType,
                title: $title,
                body: $body,
                data: [
                    'category' => $type,
                    'broadcast_by' => $actor->ulid,
                    'audience' => $targetAudience,
                    'sent_at' => now()->toIso8601String(),
                ],
                tenantId: $recipient->primaryTenant()?->id,
            );

            $recipientsCount++;

            if ($sendWhatsApp && ! empty($recipient->phone_e164)) {
                try {
                    $this->platformWhatsApp->sendOtpMessage(
                        $recipient->phone_e164,
                        "مراسيل — {$title}\n{$body}"
                    );
                    $whatsappCount++;
                } catch (Throwable) {
                    // Ignore individual WhatsApp delivery failure in broadcast
                }
            }
        }

        AuditLog::query()->create([
            'actor_user_id' => $actor->id,
            'action' => 'admin.broadcast_sent',
            'subject_type' => User::class,
            'subject_ulid' => $actor->ulid,
            'after' => [
                'title' => $title,
                'type' => $type,
                'target_audience' => $targetAudience,
                'recipients_count' => $recipientsCount,
                'whatsapp_sent' => $whatsappCount,
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return [
            'recipients_count' => $recipientsCount,
            'whatsapp_sent_count' => $whatsappCount,
        ];
    }
}
