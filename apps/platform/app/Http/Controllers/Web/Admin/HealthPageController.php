<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class HealthPageController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Health/Index', [
            'health' => [
                'otp_channel' => app()->environment(['local', 'testing']) ? 'fake' : 'production-bound',
                'whatsapp_engine' => (string) config('whatsapp.engine', 'mock'),
                'queue' => (string) config('queue.default'),
                'cache' => (string) config('cache.default'),
            ],
        ]);
    }
}
