<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DocsPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $origin = $request->getSchemeAndHttpHost();

        return Inertia::render('Public/Docs', [
            'apiBaseUrl' => $origin.'/api/v1',
            'appOrigin' => $origin,
        ]);
    }
}
