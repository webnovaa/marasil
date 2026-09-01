<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class DevicesPageController extends Controller
{
    public function index(): Response
    {
        $this->authorize('accessArea', Tenant::class);

        return Inertia::render('Tenant/Devices/Index');
    }

    public function show(string $deviceUlid): Response
    {
        $this->authorize('accessArea', Tenant::class);

        return Inertia::render('Tenant/Devices/Show', [
            'deviceUlid' => $deviceUlid,
            'engine' => (string) config('whatsapp.engine', 'mock'),
            'pairingAvailable' => (string) config('whatsapp.engine', 'mock') === 'baileys',
        ]);
    }
}
