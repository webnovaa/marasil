<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Plans\Models\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'تجربة مجانية',
                'slug' => 'free-trial',
                'description' => 'تجربة مجانية لمدة 14 يومًا للتحقق من الربط وفحص الأرقام والإرسال بدون أي مخاطر.',
                'price_minor' => 0,
                'annual_discount_percent' => 0,
                'currency' => 'USD',
                'duration_days' => 14,
                'max_devices' => 1,
                'monthly_message_limit' => 100,
                'daily_message_limit_per_device' => 20,
                'max_api_keys' => 1,
                'max_webhooks' => 1,
                'max_media_size_mb' => 8,
                'allow_media' => false,
                'allow_priority_queue' => false,
                'allow_team_members' => false,
                'features' => ['trial', 'spintax', 'number_lookup'],
                'sort_order' => 10,
            ],
            [
                'name' => 'الأساسية',
                'slug' => 'basic',
                'description' => 'مناسبة للمشاريع الناشئة والمتاجر الفردية مع دعم كامل للـ Spintax وفحص الأرقام.',
                'price_minor' => 1900,
                'annual_discount_percent' => 20,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_devices' => 2,
                'monthly_message_limit' => 5000,
                'daily_message_limit_per_device' => 300,
                'max_api_keys' => 2,
                'max_webhooks' => 3,
                'max_media_size_mb' => 16,
                'allow_media' => true,
                'allow_priority_queue' => false,
                'allow_team_members' => false,
                'features' => ['media', 'spintax', 'number_lookup'],
                'sort_order' => 20,
            ],
            [
                'name' => 'أعمال ومتاجر (الأكثر طلباً)',
                'slug' => 'business',
                'description' => 'الخيار الأفضل للشركات والمتاجر (سلة، زد، ووكومرس): طابور أولوية، أجهزة متعددة، وسائط كاملة.',
                'price_minor' => 4900,
                'annual_discount_percent' => 20,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_devices' => 5,
                'monthly_message_limit' => 25000,
                'daily_message_limit_per_device' => 1000,
                'max_api_keys' => 5,
                'max_webhooks' => 10,
                'max_media_size_mb' => 32,
                'allow_media' => true,
                'allow_priority_queue' => true,
                'allow_team_members' => true,
                'features' => ['media', 'priority_queue', 'team', 'spintax', 'number_lookup'],
                'sort_order' => 30,
            ],
            [
                'name' => 'احترافية ومؤسسات',
                'slug' => 'professional',
                'description' => 'للمؤسسات الكبرى وحملات الإشعارات الضخمة: أعلى حدود، دعم أولوية مكرس، ووصول كامل لجميع الميزات.',
                'price_minor' => 9900,
                'annual_discount_percent' => 20,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_devices' => 15,
                'monthly_message_limit' => 100000,
                'daily_message_limit_per_device' => 5000,
                'max_api_keys' => 15,
                'max_webhooks' => 30,
                'max_media_size_mb' => 64,
                'allow_media' => true,
                'allow_priority_queue' => true,
                'allow_team_members' => true,
                'features' => ['media', 'priority_queue', 'team', 'priority_support', 'spintax', 'number_lookup', 'ai_assistant'],
                'sort_order' => 40,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(
                ['slug' => $plan['slug']],
                array_merge($plan, [
                    'is_public' => true,
                    'is_active' => true,
                ]),
            );
        }
    }
}
