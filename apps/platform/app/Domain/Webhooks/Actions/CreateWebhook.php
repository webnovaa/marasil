<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Actions;

use App\Domain\Subscriptions\Services\PlanLimitGuard;
use App\Domain\Tenancy\Models\Tenant;
use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Domain\Webhooks\Services\WebhookUrlValidator;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class CreateWebhook
{
    public function __construct(
        private readonly WebhookUrlValidator $urlValidator,
        private readonly PlanLimitGuard $planLimitGuard,
    ) {}

    /**
     * @param  array{name: string, url: string, subscribed_events: list<string>}  $data
     * @return array{endpoint: WebhookEndpoint, plain_secret: string}
     */
    public function handle(Tenant $tenant, array $data): array
    {
        $this->planLimitGuard->assertCanCreateWebhook($tenant);

        try {
            $this->urlValidator->validate($data['url']);
        } catch (InvalidArgumentException $e) {
            throw new HttpResponseException(
                ApiResponse::error('WEBHOOK_URL_UNSAFE', $e->getMessage(), 422)
            );
        }

        $plainSecret = 'whsec_'.Str::lower(Str::random(40));

        $endpoint = WebhookEndpoint::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'url' => $data['url'],
            'secret_hash' => hash('sha256', $plainSecret),
            'secret_encrypted' => $plainSecret,
            'subscribed_events' => $data['subscribed_events'],
            'status' => WebhookEndpointStatus::Active,
        ]);

        return [
            'endpoint' => $endpoint,
            'plain_secret' => $plainSecret,
        ];
    }
}
