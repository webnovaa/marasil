<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Actions;

use App\Domain\Webhooks\Enums\WebhookEndpointStatus;
use App\Domain\Webhooks\Models\WebhookEndpoint;
use App\Domain\Webhooks\Services\WebhookUrlValidator;
use App\Support\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use InvalidArgumentException;

final class UpdateWebhook
{
    public function __construct(
        private readonly WebhookUrlValidator $urlValidator,
    ) {}

    /**
     * @param  array{name?: string, url?: string, subscribed_events?: list<string>, status?: string}  $data
     */
    public function handle(WebhookEndpoint $endpoint, array $data): WebhookEndpoint
    {
        if (isset($data['url'])) {
            try {
                $this->urlValidator->validate($data['url']);
            } catch (InvalidArgumentException $e) {
                throw new HttpResponseException(
                    ApiResponse::error('WEBHOOK_URL_UNSAFE', $e->getMessage(), 422)
                );
            }
            $endpoint->url = $data['url'];
        }

        if (isset($data['name'])) {
            $endpoint->name = $data['name'];
        }

        if (isset($data['subscribed_events'])) {
            $endpoint->subscribed_events = $data['subscribed_events'];
        }

        if (isset($data['status'])) {
            $status = WebhookEndpointStatus::tryFrom($data['status']);
            if ($status !== null) {
                $endpoint->status = $status;
                if ($status === WebhookEndpointStatus::Active) {
                    $endpoint->failure_count = 0;
                }
            }
        }

        $endpoint->save();

        return $endpoint->fresh() ?? $endpoint;
    }
}
