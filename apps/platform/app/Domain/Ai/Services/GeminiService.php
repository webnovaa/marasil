<?php

declare(strict_types=1);

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Models\TenantAiSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Generate an AI reply using the Google Gemini API.
     *
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function generateReply(TenantAiSetting $setting, string $userMessage, array $history = []): ?string
    {
        $apiKey = $setting->gemini_api_key;
        if (empty($apiKey)) {
            Log::warning('GeminiService: No API key configured for tenant.', ['tenant_id' => $setting->tenant_id]);
            return null;
        }

        $model = $setting->model ?: 'gemini-1.5-flash';
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        // Tone prompts
        $toneGuide = match ($setting->tone) {
            'professional' => "استخدم أسلوباً احترافياً، دقيقاً، ومهنياً مباشراً يركز على خدمة العميل بكفاءة.",
            'sales' => "استخدم أسلوباً مبيعاتياً حماسياً، أبرز المزايا والقيمة وشجع العميل بلطف على إتمام الشراء أو التعاقد.",
            'formal' => "استخدم لغة فصحى رسمية ووقورة، مع أقصى درجات الاحترام والتهذيب.",
            default => "استخدم أسلوباً ودوداً، لطيفاً، وترحيبياً يشعر العميل بالراحة والاهتمام.",
        };

        $companyName = trim((string) ($setting->company_name ?: 'المنشأة'));
        $companyBio = trim((string) $setting->company_bio);
        $productsServices = trim((string) $setting->products_services);
        $workingHours = trim((string) $setting->working_hours);
        $policies = trim((string) $setting->policies);
        $customPrompt = trim((string) $setting->system_instruction);

        $knowledgeSections = [];
        if ($companyBio !== '') {
            $knowledgeSections[] = "🏢 نبذة عن الشركة والنشاط:\n{$companyBio}";
        }
        if ($productsServices !== '') {
            $knowledgeSections[] = "📦 المنتجات والخدمات وقوائم الأسعار:\n{$productsServices}";
        }
        if ($workingHours !== '') {
            $knowledgeSections[] = "🕒 أوقات الدوام ومناطق التغطية:\n{$workingHours}";
        }
        if ($policies !== '') {
            $knowledgeSections[] = "🔄 السياسات والتحويل للدعم البشري:\n{$policies}";
        }
        if ($customPrompt !== '') {
            $knowledgeSections[] = "📋 تعليمات إضافية:\n{$customPrompt}";
        }

        $knowledgeText = implode("\n\n", $knowledgeSections);

        $fullInstruction = "أنت المساعد الذكي الرسمي لخدمة العملاء عبر واتساب لصالح ({$companyName}).\n\n"
            . "🎯 إرشادات الأسلوب والنبرة:\n{$toneGuide}\n\n"
            . ($knowledgeText !== '' ? "📚 معلومات وقواعد المنشأة (أجب حصراً بالاعتماد عليها ولا تؤلف معلومات من عندك):\n{$knowledgeText}\n\n" : '')
            . "⚠️ قواعد إلزامية:\n"
            . "1. أجب بوضوح واختصار شديد يناسب رسائل واتساب السريعة.\n"
            . "2. إذا سأل العميل عن معلومة غير متوفرة في بيانات المنشأة أعلاه، اعتذر بلطف وأخبره بأن ممثل خدمة العملاء البشري سيتواصل معه قريباً.";

        // Build contents array
        $contents = [];

        // Add history turns (limit last 6 turns to keep context fast and cheap)
        $recentHistory = array_slice($history, -6);
        foreach ($recentHistory as $turn) {
            $contents[] = [
                'role' => $turn['role'] === 'user' ? 'user' : 'model',
                'parts' => [
                    ['text' => (string) $turn['content']],
                ],
            ];
        }

        // Add latest user message
        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $userMessage],
            ],
        ];

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $fullInstruction],
                ],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float) ($setting->temperature ?? 0.70),
                'maxOutputTokens' => (int) ($setting->max_tokens ?? 1000),
            ],
        ];

        try {
            $response = Http::timeout(15)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if (! empty($reply)) {
                    return trim((string) $reply);
                }
            }

            Log::error('GeminiService: API call failed', [
                'status' => $response->status(),
                'response' => $response->body(),
                'tenant_id' => $setting->tenant_id,
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('GeminiService: Exception calling Gemini API', [
                'error' => $e->getMessage(),
                'tenant_id' => $setting->tenant_id,
            ]);

            return null;
        }
    }
}
