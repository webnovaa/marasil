<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class WebhooksPageController extends Controller
{
    public function __invoke(): Response
    {
        $this->authorize('accessArea', Tenant::class);

        return Inertia::render('Tenant/Webhooks/Index');
    }
}
