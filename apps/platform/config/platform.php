<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Internal platform tenant slug (system-owned, not a customer account)
    |--------------------------------------------------------------------------
    */
    'tenant_slug' => '_platform',

    'tenant_name' => 'Marasil Platform',

    'device_name' => 'Admin WhatsApp OTP Account',

    'device_display_name' => 'Marasil',

    /*
    |--------------------------------------------------------------------------
    | Production bootstrap (Docker / compose .env → first super admin)
    |--------------------------------------------------------------------------
    | Used by ProductionBootstrapSeeder when APP_ENV is not local/testing.
    | Prefer config() over env() so values survive `php artisan config:cache`.
    */
    'bootstrap' => [
        'super_admin_phone' => env('SUPER_ADMIN_PHONE'),
        'super_admin_password' => env('SUPER_ADMIN_PASSWORD'),
        'super_admin_name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
        'super_admin_company' => env('SUPER_ADMIN_COMPANY'),
    ],
];
