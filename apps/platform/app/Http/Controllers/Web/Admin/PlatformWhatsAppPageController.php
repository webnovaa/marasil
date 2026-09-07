<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Platform\Services\PlatformWhatsAppService;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlatformDeviceResource;
use Inertia\Inertia;
use Inertia\Response;

final class PlatformWhatsAppPageController extends Controller
{
    public function __invoke(PlatformWhatsAppService $service): Response
    {
        abort_unless(request()->user()?->hasPermission('settings.manage'), 403);

        $device = $service->device();
        $snapshot = $service->engineSnapshot($device);

        return Inertia::render('Admin/PlatformWhatsApp/Index', [
            'device' => $device !== null ? PlatformDeviceResource::make($device)->resolve() : null,
            'isReady' => $service->isReady(),
            'engine' => (string) config('whatsapp.engine', 'mock'),
            'pairingAvailable' => config('whatsapp.engine') !== 'mock' || app()->environment(['local', 'testing']),
            'engineStatus' => $snapshot['status'],
        ]);
    }
}
