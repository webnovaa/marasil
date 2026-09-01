<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class FaqPageController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Public/Faq');
    }
}
