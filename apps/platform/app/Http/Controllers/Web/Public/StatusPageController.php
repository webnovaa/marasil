<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class StatusPageController extends Controller
{
    public function __invoke(): Response
    {
        $engine = (string) config('whatsapp.engine', 'mock');

        return Inertia::render('Public/Status', [
            'services' => [
                [
                    'name' => 'واجهة المنصة (API)',
                    'status' => 'operational',
                ],
                [
                    'name' => 'قاعدة البيانات',
                    'status' => 'operational',
                ],
                [
                    'name' => 'الطوابير (Horizon)',
                    'status' => 'operational',
                ],
                [
                    'name' => 'خدمة واتساب',
                    'status' => $engine === 'baileys' ? 'operational' : 'down',
                ],
                [
                    'name' => 'التخزين',
                    'status' => 'operational',
                ],
            ],
            'disclaimer' => $engine === 'baileys'
                ? null
                : 'ربط واتساب غير متاح في هذه البيئة. الصفحة لا تدّعي أن الإرسال الحقيقي يعمل.',
        ]);
    }
}
