<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Billing\Models\PaymentMethod;
use App\Domain\Platform\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingsAndPaymentMethodsSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::query()->firstOrCreate(
            ['key' => PlatformSetting::AI_MASTER_ENABLED],
            ['value' => '1'],
        );

        $methods = [
            [
                'code' => 'usdt',
                'name' => 'USDT (TRC20)',
                'badge' => 'عالمي وسريع',
                'address_or_code' => 'TJ9f8D2M2pXmN8eS7yQZ5V1bL3k4wU6hRq',
                'account_holder' => null,
                'network' => 'TRON (TRC20)',
                'instructions' => 'أرسل المبلغ بالدولار الرقمي USDT عبر شبكة ترون TRC20 حصرًا لتفادي أي ضياع للرصيد.',
                'qr_payload' => 'TJ9f8D2M2pXmN8eS7yQZ5V1bL3k4wU6hRq',
                'is_enabled' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'shamcash',
                'name' => 'شام كاش / الهرم',
                'badge' => 'سورية والمجاورة',
                'address_or_code' => '963955123456',
                'account_holder' => 'مكتب مراسيل لتقنية المعلومات / وسام محمد (دمشق - المرجة)',
                'network' => null,
                'instructions' => 'حوّل عبر شام كاش برقم الحساب أعلاه، أو عبر مكتب الهرم / الفؤاد بالاسم المحدد ثم ارفع صورة الإشعار.',
                'qr_payload' => 'shamcash:963955123456',
                'is_enabled' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'stcpay',
                'name' => 'STC Pay / بنكي عربي',
                'badge' => 'الخليج والدول العربية',
                'address_or_code' => 'SA0380000123608010123456',
                'account_holder' => 'مراسيل كلاود (هاتف STC Pay: 0501234567)',
                'network' => null,
                'instructions' => 'التحويل المباشر عبر STC Pay أو عبر رقم الآيبان المصرفي الموضح.',
                'qr_payload' => 'SA0380000123608010123456',
                'is_enabled' => true,
                'sort_order' => 30,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::query()->updateOrCreate(
                ['code' => $method['code']],
                $method,
            );
        }
    }
}
