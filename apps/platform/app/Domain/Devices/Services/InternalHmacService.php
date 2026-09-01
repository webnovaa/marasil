<?php

declare(strict_types=1);

namespace App\Domain\Devices\Services;

use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

final class InternalHmacService
{
    public function secret(): string
    {
        $secret = (string) config('whatsapp.internal_hmac_secret', '');

        if ($secret === '') {
            throw new RuntimeException('INTERNAL_HMAC_SECRET is not configured.');
        }

        return $secret;
    }

    /**
     * @return array{timestamp: string, signature: string}
     */
    public function sign(string $method, string $path, string $body, ?int $timestamp = null): array
    {
        $timestamp ??= time();
        $signature = $this->computeSignature($method, $path, $body, $timestamp);

        return [
            'timestamp' => (string) $timestamp,
            'signature' => $signature,
        ];
    }

    public function verify(
        string $method,
        string $path,
        string $body,
        ?string $timestampHeader,
        ?string $signatureHeader,
    ): bool {
        if ($timestampHeader === null || $timestampHeader === '' || $signatureHeader === null || $signatureHeader === '') {
            return false;
        }

        if (! ctype_digit($timestampHeader)) {
            return false;
        }

        $timestamp = (int) $timestampHeader;
        $maxSkew = (int) config('whatsapp.hmac_max_skew_seconds', 300);

        if (abs(time() - $timestamp) > $maxSkew) {
            return false;
        }

        $expected = $this->computeSignature($method, $path, $body, $timestamp);

        return hash_equals($expected, $signatureHeader);
    }

    public function verifyRequest(Request $request, ?string $rawBody = null): bool
    {
        $path = '/'.$request->path();
        $body = $rawBody ?? $request->getContent();

        return $this->verify(
            $request->method(),
            $path,
            is_string($body) ? $body : '',
            $request->header('X-Internal-Timestamp'),
            $request->header('X-Internal-Signature'),
        );
    }

    public function computeSignature(string $method, string $path, string $body, int $timestamp): string
    {
        if ($path === '' || $path[0] !== '/') {
            throw new InvalidArgumentException('Path must start with /');
        }

        $bodyHash = hash('sha256', $body);
        $payload = $timestamp.'.'.strtoupper($method).'.'.$path.'.'.$bodyHash;

        return hash_hmac('sha256', $payload, $this->secret());
    }
}
