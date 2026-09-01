<?php

declare(strict_types=1);

namespace App\Domain\Webhooks\Services;

use InvalidArgumentException;

final class WebhookUrlValidator
{
    /**
     * @throws InvalidArgumentException
     */
    public function validate(string $url): void
    {
        $parts = parse_url($url);

        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            throw new InvalidArgumentException('Webhook URL is invalid.');
        }

        $scheme = strtolower((string) $parts['scheme']);
        $host = strtolower((string) $parts['host']);

        $requireHttps = app()->environment('production')
            || (bool) config('webhooks.require_https', false);

        if ($requireHttps && $scheme !== 'https') {
            throw new InvalidArgumentException('Webhook URL must use HTTPS in production.');
        }

        if (! in_array($scheme, ['https', 'http'], true)) {
            throw new InvalidArgumentException('Webhook URL scheme is not allowed.');
        }

        if ($host === '' || $host === 'localhost' || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            throw new InvalidArgumentException('Webhook URL host is not allowed.');
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $this->assertPublicIp($host);

            return;
        }

        $resolved = @dns_get_record($host, DNS_A + DNS_AAAA);
        if ($resolved === false || $resolved === []) {
            // Allow unresolved hosts in non-production (e.g. tests / local DNS); still reject obvious private hostnames.
            if (app()->environment('production')) {
                throw new InvalidArgumentException('Webhook URL host could not be resolved.');
            }

            return;
        }

        foreach ($resolved as $record) {
            $ip = $record['ip'] ?? $record['ipv6'] ?? null;
            if (is_string($ip) && $ip !== '') {
                $this->assertPublicIp($ip);
            }
        }
    }

    /**
     * @throws InvalidArgumentException
     */
    private function assertPublicIp(string $ip): void
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            throw new InvalidArgumentException('Webhook URL must not target private or reserved addresses.');
        }
    }
}
