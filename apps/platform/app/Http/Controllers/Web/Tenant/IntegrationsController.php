<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class IntegrationsController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->select(['id', 'ulid', 'display_name', 'phone_e164'])
            ->get();

        $webhookUrl = url("/api/v1/integrations/{$tenant->ulid}/webhook");

        $platforms = [
            [
                'id' => 'salla',
                'name' => 'منصة سلة (Salla)',
                'badge' => 'الأكثر طلباً',
                'description' => 'الربط التلقائي الفوري مع متجر سلة لإرسال إشعارات تأكيد الطلب، تحديثات الشحن، واسترجاع السلات المتروكة.',
                'events' => [
                    [
                        'name' => 'تأكيد الطلب الجديد (order.created)',
                        'template' => "عزيزنا {customer_name}، تم تأكيد طلبك رقم #{order_id} بنجاح بقيمة {total} ر.س. شكراً لتسوقك معنا! 🛍️",
                    ],
                    [
                        'name' => 'شحن الطلب والتتبع (order.shipping)',
                        'template' => "مرحباً {customer_name}، تم تسليم طلبك #{order_id} لشركة {shipping_company}. رابط التتبع: {tracking_link} 🚚",
                    ],
                    [
                        'name' => 'استرجاع السلات المتروكة (cart.abandoned)',
                        'template' => "أهلاً {customer_name}، منتجاتك تنتظرك في السلة! استخدم كود الخصم {coupon} للحصول على خصم 10% فوراً ✨",
                    ],
                    [
                        'name' => 'رمز التحقق السريع (auth.otp)',
                        'template' => "رمز التحقق لتسجيل الدخول إلى متجرنا هو: {otp}. الرمز صالح لمدة 5 دقائق.",
                    ],
                ],
            ],
            [
                'id' => 'zid',
                'name' => 'منصة زد (Zid)',
                'badge' => 'شائع في السعودية',
                'description' => 'تكامل شامل مع متجر زد لإرسال رسائل الواتساب اللحظية عند تغير حالة الطلب والفواتير الإلكترونية.',
                'events' => [
                    [
                        'name' => 'تم استلام الطلب والدفع',
                        'template' => "أهلاً {customer_name}، تم تأكيد سداد طلبك #{order_id}. سنقوم بتجهيزه وشحنه بأسرع وقت! ✨",
                    ],
                    [
                        'name' => 'الطلب قيد التوصيل',
                        'template' => "مندوب التوصيل في طريقه إليك لتسليم طلبك #{order_id}. الرجاء التواجد في العنوان المحدد 📍",
                    ],
                ],
            ],
            [
                'id' => 'woocommerce',
                'name' => 'ووكومرس (WooCommerce)',
                'badge' => 'WordPress',
                'description' => 'إضافة ووكومرس الرسمية أو ربط الويب هوك المباشر مع متاجر ووردبريس لإشعارات البيع والشحن.',
                'events' => [
                    [
                        'name' => 'طلب جديد تم إنشاؤه',
                        'template' => "طلب جديد رقم #{order_id} من {customer_name}. الإجمالي: {total}. رابط الفاتورة: {invoice_url}",
                    ],
                    [
                        'name' => 'اكتمال الطلب',
                        'template' => "عزيزنا {customer_name}، يسعدنا إبلاغك باكتمال تنفيذ طلبك #{order_id}. نتمنى لك تجربة رائعة!",
                    ],
                ],
            ],
            [
                'id' => 'shopify',
                'name' => 'شوبيفاي (Shopify)',
                'badge' => 'عالمي',
                'description' => 'ربط متجر Shopify عبر Webhook لإرسال إشعارات الواتساب العالمية للعملاء في الشرق الأوسط.',
                'events' => [
                    [
                        'name' => 'Orders creation',
                        'template' => "Thank you {customer_name} for your order #{order_id}! We are preparing it now.",
                    ],
                    [
                        'name' => 'Orders fulfilled',
                        'template' => "Your package is on its way! Track your order #{order_id} here: {tracking_url}",
                    ],
                ],
            ],
        ];

        return Inertia::render('Tenant/Integrations/Index', [
            'platforms' => $platforms,
            'devices' => $devices,
            'webhookUrl' => $webhookUrl,
        ]);
    }

    public function simulate(Request $request, AcceptTextMessage $acceptTextMessage): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'platform' => ['required', 'string'],
            'event' => ['required', 'string'],
            'custom_text' => ['nullable', 'string'],
            'device_id' => ['nullable', 'string'],
        ]);

        $device = null;
        if (! empty($validated['device_id'])) {
            $device = Device::query()
                ->where('tenant_id', $tenant->id)
                ->where('ulid', $validated['device_id'])
                ->first();
        }

        if (! $device) {
            $device = Device::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'connected')
                ->first();
        }

        if (! $device) {
            return response()->json([
                'error' => 'يرجى ربط جهاز واتساب نشط أولاً لتجربة المحاكاة.',
            ], 422);
        }

        $sampleVariables = [
            '{customer_name}' => 'أحمد العبدالله',
            '{order_id}' => (string) rand(10240, 99999),
            '{total}' => '350.00',
            '{shipping_company}' => 'أرامكس (Aramex)',
            '{tracking_link}' => 'https://track.aramex.com/pkg/9871234',
            '{tracking_url}' => 'https://track.aramex.com/pkg/9871234',
            '{coupon}' => 'SAVE10',
            '{otp}' => (string) rand(1000, 9999),
            '{invoice_url}' => 'https://store.local/inv/8391',
        ];

        $rawTemplate = $validated['custom_text'] ?: "عزيزنا {customer_name}، تم تأكيد طلبك #{order_id} بقيمة {total} ر.س بنجاح! 🛍️";
        $renderedMessage = str_replace(array_keys($sampleVariables), array_values($sampleVariables), $rawTemplate);

        try {
            $message = $acceptTextMessage->handle(
                tenant: $tenant,
                data: [
                    'device_id' => $device->ulid,
                    'to' => $validated['phone'],
                    'message' => $renderedMessage,
                    'category' => 'transactional',
                ],
            );

            return response()->json([
                'success' => true,
                'rendered_message' => $renderedMessage,
                'message_id' => $message->ulid,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'فشلت المحاكاة: ' . $e->getMessage(),
            ], 500);
        }
    }
}
