<?php

declare(strict_types=1);

return [
    'require_https' => (bool) env('WEBHOOKS_REQUIRE_HTTPS', false),
    'timeout_seconds' => (int) env('WEBHOOKS_TIMEOUT_SECONDS', 10),
    'max_retries' => 5,
    /** Retry delays in minutes after failures: 1m, 5m, 30m, 2h, 12h then abandoned */
    'retry_delays_minutes' => [1, 5, 30, 120, 720],
    'allowed_events' => [
        'message.queued',
        'message.sent',
        'message.delivered',
        'message.read',
        'message.failed',
        'device.connected',
        'device.disconnected',
        'webhook.test',
        '*',
    ],
];
