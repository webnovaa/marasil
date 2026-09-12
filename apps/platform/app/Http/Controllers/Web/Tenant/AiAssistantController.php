<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Ai\Models\TenantAiSetting;
use App\Domain\Ai\Services\GeminiService;
use App\Domain\Platform\Models\PlatformSetting;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AiAssistantController extends Controller
{
    public function index(Request $request, SubscriptionGate $subscriptionGate): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $hasPlanAccess = $subscriptionGate->hasFeature($tenant, 'ai_assistant');
        $isMasterEnabled = PlatformSetting::isAiMasterEnabled();
        $currentSubscription = $subscriptionGate->currentSubscription($tenant);

        $setting = TenantAiSetting::query()->firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'model' => 'gemini-1.5-flash',
                'company_name' => $tenant->name ?: '',
                'company_bio' => '',
                'products_services' => '',
                'working_hours' => '',
                'policies' => '',
                'system_instruction' => "مرحباً بكم في متجرنا وخدماتنا. يسعدنا تقديم المساعدة بخصوص المنتجات، مواعيد العمل، الأسعار، وحالة الطلبات.",
                'tone' => 'friendly',
                'is_enabled' => false,
                'temperature' => 0.70,
                'max_tokens' => 800,
                'total_ai_replies' => 0,
            ]
        );

        $hasApiKey = ! empty($setting->gemini_api_key);
        $maskedKey = $hasApiKey
            ? substr($setting->gemini_api_key, 0, 6) . '••••••••' . substr($setting->gemini_api_key, -4)
            : '';

        $models = [
            [
                'id' => 'gemini-1.5-flash',
                'name' => 'Gemini 1.5 Flash (موصى به)',
                'description' => 'فائق السرعة وخفيف التكلفة، مثالي لردود الواتساب الفورية والاستفسارات السريعة.',
                'tag' => 'الأسرع والأوفر',
            ],
            [
                'id' => 'gemini-2.0-flash',
                'name' => 'Gemini 2.0 Flash (الجيل الجديد)',
                'description' => 'أحدث طراز من جوجل، يقدم دقة فهم استثنائية واستجابة شبه لحظية للمحادثات.',
                'tag' => 'الأحدث',
            ],
            [
                'id' => 'gemini-1.5-pro',
                'name' => 'Gemini 1.5 Pro (الأعلى ذكاءً)',
                'description' => 'لقواعد المعرفة الضخمة، والردود المعقدة والاستشارات المبيعاتية المتقدمة.',
                'tag' => 'ذكاء خارق',
            ],
        ];

        $tones = [
            [
                'id' => 'friendly',
                'name' => 'ودود ومرحب',
                'description' => 'أسلوب لطيف وحيوي يشعر العميل بالراحة والقرب.',
            ],
            [
                'id' => 'professional',
                'name' => 'احترافي ودقيق',
                'description' => 'أسلوب مهني ومباشر، يركز على الحلول والمعلومات المؤكدة.',
            ],
            [
                'id' => 'sales',
                'name' => 'مبيعات وإقناع',
                'description' => 'يركز على إبراز المزايا التنافسية وحث العميل على الشراء أو الحجز.',
            ],
            [
                'id' => 'formal',
                'name' => 'رسمي وقور',
                'description' => 'لغة فصحى رسمية للشركات الكبرى والمؤسسات والجهات القانونية.',
            ],
        ];

        return Inertia::render('Tenant/AiAssistant/Index', [
            'settings' => [
                'model' => $setting->model,
                'company_name' => $setting->company_name ?? '',
                'company_bio' => $setting->company_bio ?? '',
                'products_services' => $setting->products_services ?? '',
                'working_hours' => $setting->working_hours ?? '',
                'policies' => $setting->policies ?? '',
                'system_instruction' => $setting->system_instruction ?? '',
                'tone' => $setting->tone ?? 'friendly',
                'is_enabled' => (bool) $setting->is_enabled,
                'temperature' => (float) $setting->temperature,
                'max_tokens' => (int) $setting->max_tokens,
                'total_ai_replies' => (int) $setting->total_ai_replies,
                'has_api_key' => $hasApiKey,
                'masked_key' => $maskedKey,
            ],
            'models' => $models,
            'tones' => $tones,
            'hasPlanAccess' => $hasPlanAccess,
            'isMasterEnabled' => $isMasterEnabled,
            'currentPlanName' => $currentSubscription?->plan_name ?? 'الخطة الحالية',
        ]);
    }

    public function update(Request $request, SubscriptionGate $subscriptionGate): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        if (! $subscriptionGate->hasFeature($tenant, 'ai_assistant')) {
            return back()->with('error', 'ميزة المساعد الذكي Google Gemini متاحة حصرياً في الخطة الاحترافية (Professional). يرجى ترقية خطتك للوصول.');
        }

        $validated = $request->validate([
            'gemini_api_key' => ['nullable', 'string', 'max:500'],
            'model' => ['required', 'string', 'in:gemini-1.5-flash,gemini-2.0-flash,gemini-1.5-pro'],
            'company_name' => ['nullable', 'string', 'max:128'],
            'company_bio' => ['nullable', 'string', 'max:5000'],
            'products_services' => ['nullable', 'string', 'max:8000'],
            'working_hours' => ['nullable', 'string', 'max:2000'],
            'policies' => ['nullable', 'string', 'max:4000'],
            'system_instruction' => ['nullable', 'string', 'max:8000'],
            'tone' => ['required', 'string', 'in:friendly,professional,sales,formal'],
            'is_enabled' => ['required', 'boolean'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'max_tokens' => ['nullable', 'integer', 'min:100', 'max:4000'],
        ]);

        $setting = TenantAiSetting::query()->firstOrCreate(['tenant_id' => $tenant->id]);

        $updates = [
            'model' => $validated['model'],
            'company_name' => $validated['company_name'] ?? null,
            'company_bio' => $validated['company_bio'] ?? null,
            'products_services' => $validated['products_services'] ?? null,
            'working_hours' => $validated['working_hours'] ?? null,
            'policies' => $validated['policies'] ?? null,
            'system_instruction' => $validated['system_instruction'] ?? null,
            'tone' => $validated['tone'],
            'is_enabled' => $validated['is_enabled'],
            'temperature' => $validated['temperature'] ?? 0.70,
            'max_tokens' => $validated['max_tokens'] ?? 800,
        ];

        // Only update API key if a new non-masked key is provided
        if (! empty($validated['gemini_api_key']) && ! str_contains($validated['gemini_api_key'], '••••')) {
            $updates['gemini_api_key'] = trim($validated['gemini_api_key']);
        }

        $setting->update($updates);

        return back()->with('success', 'تم حفظ إعدادات وقاعدة معرفة المساعد الذكي Google Gemini بنجاح!');
    }

    public function test(Request $request, GeminiService $geminiService, SubscriptionGate $subscriptionGate): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        if (! $subscriptionGate->hasFeature($tenant, 'ai_assistant')) {
            return response()->json([
                'reply' => '🔒 ميزة المساعد الذكي Google Gemini متاحة حصرياً في الخطة الاحترافية (Professional). يرجى الترقية لتفعيلها.',
                'status' => 'plan_restricted',
            ], 403);
        }

        if (! PlatformSetting::isAiMasterEnabled()) {
            return response()->json([
                'reply' => '⚠️ خدمة الذكاء الاصطناعي متوقفة مؤقتاً للصيانة على مستوى المنصة.',
                'status' => 'master_disabled',
            ], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'model' => ['nullable', 'string'],
            'company_name' => ['nullable', 'string'],
            'company_bio' => ['nullable', 'string'],
            'products_services' => ['nullable', 'string'],
            'working_hours' => ['nullable', 'string'],
            'policies' => ['nullable', 'string'],
            'system_instruction' => ['nullable', 'string'],
            'tone' => ['nullable', 'string'],
            'gemini_api_key' => ['nullable', 'string'],
        ]);

        $setting = TenantAiSetting::query()->where('tenant_id', $tenant->id)->first();

        // Create temporary setting instance for live test
        $tempSetting = new TenantAiSetting();
        $tempSetting->tenant_id = $tenant->id;
        $tempSetting->model = $validated['model'] ?? $setting?->model ?? 'gemini-1.5-flash';
        $tempSetting->company_name = $validated['company_name'] ?? $setting?->company_name;
        $tempSetting->company_bio = $validated['company_bio'] ?? $setting?->company_bio;
        $tempSetting->products_services = $validated['products_services'] ?? $setting?->products_services;
        $tempSetting->working_hours = $validated['working_hours'] ?? $setting?->working_hours;
        $tempSetting->policies = $validated['policies'] ?? $setting?->policies;
        $tempSetting->system_instruction = $validated['system_instruction'] ?? $setting?->system_instruction;
        $tempSetting->tone = $validated['tone'] ?? $setting?->tone ?? 'friendly';

        $apiKey = ! empty($validated['gemini_api_key']) && ! str_contains($validated['gemini_api_key'], '••••')
            ? $validated['gemini_api_key']
            : $setting?->gemini_api_key;

        $tempSetting->gemini_api_key = $apiKey;

        if (empty($tempSetting->gemini_api_key)) {
            return response()->json([
                'reply' => '⚠️ يرجى إدخال مفتاح Gemini API أولاً لإجراء المحاكاة الحية.',
                'status' => 'missing_key',
            ]);
        }

        $reply = $geminiService->generateReply($tempSetting, $validated['message']);

        if ($reply === null) {
            return response()->json([
                'reply' => 'تعذر الاتصال بخدمة Google Gemini. تأكد من صحة مفتاح الـ API والاتصال بالإنترنت.',
                'status' => 'error',
            ], 422);
        }

        return response()->json([
            'reply' => $reply,
            'status' => 'success',
        ]);
    }
}
