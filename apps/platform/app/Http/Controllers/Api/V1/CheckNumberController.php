<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CheckNumberController extends Controller
{
    public function check(Request $request, WhatsAppServiceClient $client): JsonResponse
    {
        // 1. Extract username
        $username = $request->input('username')
            ?? $request->input('user')
            ?? $request->input('tenant')
            ?? $request->header('X-Username');

        if (! is_string($username) || trim($username) === '') {
            return ApiResponse::error(
                'USERNAME_REQUIRED',
                'اسم المستخدم مطلوب (username). يمكنك نسخه من صفحة الجهاز في المنصة.',
                422
            );
        }

        $username = trim($username);

        // 2. Resolve Tenant
        $tenant = Tenant::query()->where('slug', $username)->first();

        if ($tenant === null) {
            $phoneLookup = ltrim($username, '+');
            $user = User::query()
                ->where('phone_e164', '+'.$phoneLookup)
                ->orWhere('phone_e164', $phoneLookup)
                ->first();

            if ($user !== null) {
                $tenant = $user->primaryTenant();
            }
        }

        if ($tenant === null) {
            return ApiResponse::error(
                'USER_NOT_FOUND',
                "اسم المستخدم '{$username}' غير صحيح أو لا يوجد حساب مطابق.",
                404
            );
        }

        // 3. Extract Device identifier
        $deviceInput = $request->input('device')
            ?? $request->input('device_name')
            ?? $request->input('instance')
            ?? $request->input('device_id');

        $device = null;

        if (is_string($deviceInput) && trim($deviceInput) !== '') {
            $trimmed = trim($deviceInput);
            $device = Device::query()
                ->where('tenant_id', $tenant->id)
                ->where(function ($query) use ($trimmed): void {
                    $query->where('name', $trimmed)
                        ->orWhere('ulid', $trimmed);
                })
                ->first();

            if ($device === null) {
                return ApiResponse::error(
                    'DEVICE_NOT_FOUND',
                    "الجهاز '{$trimmed}' غير موجود في حسابك.",
                    404
                );
            }
        } else {
            // Fallback: Check if tenant has connected devices
            $connectedDevices = Device::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', DeviceStatus::Connected)
                ->get();

            if ($connectedDevices->count() === 1) {
                $device = $connectedDevices->first();
            } else {
                $allDevices = Device::query()->where('tenant_id', $tenant->id)->get();
                if ($allDevices->count() === 1) {
                    $device = $allDevices->first();
                } else {
                    return ApiResponse::error(
                        'DEVICE_REQUIRED',
                        'اسم الجهاز (device) مطلوب لاختيار جهاز الفحص المناسب.',
                        422
                    );
                }
            }
        }

        if ($device->status !== DeviceStatus::Connected) {
            return ApiResponse::error(
                'DEVICE_NOT_CONNECTED',
                "الجهاز '{$device->name}' غير متصل حالياً بالواتساب. يجب أن يكون الجهاز متصلاً لتنفيذ الفحص الفوري.",
                422
            );
        }

        // 4. Extract Phone Number
        $rawPhone = $request->input('phone')
            ?? $request->input('to')
            ?? $request->input('mobile')
            ?? $request->input('number')
            ?? $request->input('recipient');

        if (! is_string($rawPhone) || trim($rawPhone) === '') {
            return ApiResponse::error(
                'PHONE_REQUIRED',
                'رقم الهاتف المراد فحصه مطلوب (phone).',
                422
            );
        }

        $cleanDigits = preg_replace('/[^\d]/', '', trim($rawPhone)) ?? '';

        if (strlen($cleanDigits) < 7) {
            return ApiResponse::error(
                'INVALID_PHONE_FORMAT',
                'يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة (مثال: +963944123456).',
                422
            );
        }

        $formattedPhone = '+'.$cleanDigits;

        // 5. Query WhatsApp Service
        try {
            $result = $client->checkNumber($device->ulid, [
                'phone_number' => $cleanDigits,
            ]);

            $data = $result['data'] ?? $result;
            $exists = (bool) ($data['exists'] ?? false);

            return ApiResponse::success([
                'phone' => $formattedPhone,
                'exists' => $exists,
                'status' => $exists ? 'valid' : 'not_registered',
                'device' => $device->name,
                'message' => $exists
                    ? 'الرقم يملك حساب واتساب نشط وجاهز لاستقبال الرسائل'
                    : 'الرقم غير مسجل على واتساب',
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::error(
                'CHECK_FAILED',
                'تعذر استعلام الواتساب عن الرقم في الوقت الحالي: '.$e->getMessage(),
                503
            );
        }
    }
}
