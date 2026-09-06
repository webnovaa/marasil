<?php

// Disposable browser-test server. Never use the application's PostgreSQL data.
$database = tempnam(sys_get_temp_dir(), 'marasil-browser-');
$settings = [
    'APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'APP_URL' => 'http://localhost:8181',
    'APP_KEY' => 'base64:'.base64_encode(random_bytes(32)),
    'APP_CONFIG_CACHE' => sys_get_temp_dir().'/marasil-browser-no-config.php',
    'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => $database, 'DB_URL' => '',
    'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'file', 'SESSION_COOKIE' => 'marasil_browser_test',
    'SESSION_SECURE_COOKIE' => 'false', 'QUEUE_CONNECTION' => 'sync',
    'OTP_CHANNEL' => 'fake', 'OTP_PEPPER' => 'browser-test-only', 'MAIL_MAILER' => 'array',
    'SANCTUM_STATEFUL_DOMAINS' => 'localhost:8181,127.0.0.1:8181',
];
foreach ($settings as $key => $value) {
    putenv($key.'='.$value);
    $_ENV[$key] = $_SERVER[$key] = $value;
}
require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
\Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
\Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
echo "Isolated browser test server listening on port 8181.\n";
\Illuminate\Support\Facades\Artisan::call('serve', ['--host' => '0.0.0.0', '--port' => 8181, '--no-reload' => true]);
