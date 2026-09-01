<?php

declare(strict_types=1);

return [
    'app_name' => 'Marasil',
    'dashboard' => 'Dashboard',
    'devices' => 'Devices',
    'messages' => 'Messages',
    'subscription' => 'Subscription',
    'api_key' => 'API Key',
    'connected' => 'Connected',
    'queued' => 'Queued',
    'sent' => 'Sent',
    'failed' => 'Failed',
    'errors' => [
        'SUBSCRIPTION_REQUIRED' => 'An active subscription is required.',
        'SUBSCRIPTION_EXPIRED' => 'Subscription has expired.',
        'DEVICE_LIMIT_EXCEEDED' => 'Device limit reached.',
        'MESSAGE_QUOTA_EXCEEDED' => 'Monthly message quota reached.',
        'PERMISSION_DENIED' => 'You do not have permission for this action.',
        'FEATURE_NOT_INCLUDED' => 'This feature is not included in your plan.',
        'RECIPIENT_SUPPRESSED' => 'Recipient is on the suppression list.',
    ],
];
