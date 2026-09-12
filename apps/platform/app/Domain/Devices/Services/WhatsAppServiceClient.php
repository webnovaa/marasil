<?php

declare(strict_types=1);

namespace App\Domain\Devices\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

final class WhatsAppServiceClient
{
    public function __construct(
        private readonly InternalHmacService $hmac,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function createSession(string $deviceUlid, array $payload = []): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/start', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function disconnect(string $deviceUlid, array $payload = []): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/disconnect', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function logout(string $deviceUlid, array $payload = []): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/logout', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function requestPairingCode(string $deviceUlid, array $payload): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/pairing-code', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function sendMessage(array $payload): array
    {
        return $this->request('POST', '/internal/v1/messages/send', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function sendMedia(array $payload): array
    {
        return $this->request('POST', '/internal/v1/messages/send-media', $payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function deviceHealth(string $deviceUlid): array
    {
        return $this->request('GET', '/internal/v1/devices/'.$deviceUlid.'/status');
    }

    /** @param array<string, mixed> $payload @return array<string, mixed> */
    public function reconnect(string $deviceUlid, array $payload): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/reconnect', $payload);
    }

    /** @return array<string, mixed> */
    public function deleteSession(string $deviceUlid): array
    {
        return $this->request('DELETE', '/internal/v1/devices/'.$deviceUlid.'/session');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function checkNumber(string $deviceUlid, array $payload): array
    {
        return $this->request('POST', '/internal/v1/devices/'.$deviceUlid.'/check-number', $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $payload = []): array
    {
        $base = (string) config('whatsapp.service_url');
        $timeout = (int) config('whatsapp.timeout', 10);
        $body = $method === 'GET' ? '' : (string) json_encode($payload, JSON_THROW_ON_ERROR);
        $signed = $this->hmac->sign($method, $path, $body);
        $nonce = (string) Str::uuid();
        $url = $base.$path;

        try {
            $pending = Http::timeout($timeout)
                ->acceptJson()
                ->withHeaders([
                    'X-Internal-Timestamp' => $signed['timestamp'],
                    'X-Internal-Signature' => $signed['signature'],
                    'X-Internal-Nonce' => $nonce,
                    'X-Request-Id' => 'req_'.Str::lower((string) Str::ulid()),
                    'X-Contract-Version' => (string) config('whatsapp.contract_version', '1'),
                ]);

            $response = match (strtoupper($method)) {
                'GET' => $pending->get($url),
                'POST' => $pending->withBody($body, 'application/json')->post($url),
                'DELETE' => $pending->withBody($body, 'application/json')->delete($url),
                default => throw new RuntimeException('Unsupported HTTP method: '.$method),
            };

            $response->throw();
        } catch (ConnectionException|RequestException $e) {
            throw new RuntimeException('WhatsApp service request failed: '.$e->getMessage(), previous: $e);
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        return $json;
    }
}
