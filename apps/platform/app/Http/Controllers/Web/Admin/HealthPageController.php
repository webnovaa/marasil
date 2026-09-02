<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Domain\Administration\Services\SystemHealthService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class HealthPageController extends Controller
{
    public function __invoke(SystemHealthService $health): Response
    {
        return Inertia::render('Admin/Health/Index', [
            'health' => $health->snapshot(),
        ]);
    }
}
