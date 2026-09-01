<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Services;

final class WebhookSigner
{
    /**
     * @return array{id: string, timestamp: string, signature: string}
     */
    public function sign(string $secret, string $webhookId, string $timestamp, string $body): array
    {
        $payload = $timestamp.'.'.$body;
        $signature = 'sha256='.hash_hmac('sha256', $payload, $secret);

        return [
            'id' => $webhookId,
            'timestamp' => $timestamp,
            'signature' => $signature,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function headers(string $secret, string $webhookId, string $timestamp, string $body): array
    {
        $signed = $this->sign($secret, $webhookId, $timestamp, $body);

        return [
            'X-Webhook-Id' => $signed['id'],
            'X-Webhook-Timestamp' => $signed['timestamp'],
            'X-Webhook-Signature' => $signed['signature'],
            'Content-Type' => 'application/json',
            'User-Agent' => 'WhatsApp-API-SaaS-Webhook/1.0',
        ];
    }
}
