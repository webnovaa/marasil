<?php

declare(strict_types=1);

namespace App\Domain\Notifications\Services;

use App\Domain\Notifications\Models\NotificationPreference;
use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Throwable;

final class TenantOwnerAlertService
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly PlatformWhatsAppService $platformWhatsApp,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function alert(
        Tenant $tenant,
        string $type,
        string $title,
        string $body,
        array $data = [],
        ?string $dedupeKey = null,
        bool $whatsapp = true,
    ): void {
        $owner = $tenant->relationLoaded('owner')
            ? $tenant->owner
            : $tenant->owner()->first();

        if ($owner === null) {
            return;
        }

        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $owner->id],
            [
                'in_app_enabled' => true,
                'security_critical_enabled' => true,
                'usage_alerts_enabled' => true,
                'device_alerts_enabled' => true,
                'message_alerts_enabled' => true,
                'whatsapp_alerts_enabled' => true,
            ],
        );

        $isSecurity = str_starts_with($type, 'security.');
        $isMessageLike = str_starts_with($type, 'message.') || str_starts_with($type, 'webhook.');

        if ($isMessageLike && ! ($prefs->message_alerts_enabled ?? true) && ! $isSecurity) {
            return;
        }

        try {
            $this->notifications->notify(
                user: $owner,
                type: $type,
                title: $title,
                body: $body,
                data: $data,
                dedupeKey: $dedupeKey,
                tenantId: $tenant->id,
            );
        } catch (Throwable $e) {
            Log::warning('Tenant owner in-app alert failed', [
                'tenant_id' => $tenant->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }

        $allowWhatsApp = $whatsapp && ($isSecurity || ($prefs->whatsapp_alerts_enabled ?? true));
        if (! $allowWhatsApp) {
            return;
        }

        $phone = $owner->phone_e164;
        if (! is_string($phone) || $phone === '') {
            return;
        }

        try {
            $this->platformWhatsApp->sendOtpMessage(
                $phone,
                "مراسيل: {$title}\n{$body}",
            );
        } catch (Throwable $e) {
            Log::warning('Tenant owner WhatsApp alert failed', [
                'tenant_id' => $tenant->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
