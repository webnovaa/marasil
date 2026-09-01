<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp Service (internal Node worker)
    |--------------------------------------------------------------------------
    */
    'service_url' => rtrim((string) env('WHATSAPP_SERVICE_URL', 'http://whatsapp-service:3100'), '/'),

    'timeout' => (int) env('WHATSAPP_SERVICE_TIMEOUT', 10),

    /*
    |--------------------------------------------------------------------------
    | Shared HMAC secret between Laravel and WhatsApp service
    |--------------------------------------------------------------------------
    |
    | Never commit real secrets. Set via environment only.
    |
    */
    'internal_hmac_secret' => (string) env('INTERNAL_HMAC_SECRET', ''),

    'hmac_max_skew_seconds' => (int) env('INTERNAL_HMAC_MAX_SKEW', 300),

    'contract_version' => '1',

    'socket_token_secret' => (string) env('SOCKET_TOKEN_SECRET', env('INTERNAL_HMAC_SECRET', '')),

    'socket_token_ttl_seconds' => (int) env('SOCKET_TOKEN_TTL_SECONDS', 600),

    /*
    | Mock engine is for local/testing only. Production must use baileys.
    */
    'engine' => (string) env('WHATSAPP_ENGINE', 'mock'),
];
