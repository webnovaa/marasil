<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SendQuickMessageController extends Controller
{
    public function send(Request $request, AcceptTextMessage $action): JsonResponse
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
            // Also try matching by owner's phone number
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
        $device = $request->input('device')
            ?? $request->input('device_name')
            ?? $request->input('instance')
            ?? $request->input('device_id');

        if (is_string($device)) {
            $device = trim($device);
        }

        // 4. Extract & Normalize Recipient Phone Number
        $rawTo = $request->input('to')
            ?? $request->input('phone')
            ?? $request->input('mobile')
            ?? $request->input('number')
            ?? $request->input('recipient');

        if (! is_string($rawTo) || trim($rawTo) === '') {
            return ApiResponse::error('RECIPIENT_REQUIRED', 'رقم هاتف المستلم مطلوب (to).', 422);
        }

        $normalizedTo = preg_replace('/[^\d+]/', '', trim($rawTo)) ?? '';
        if (str_starts_with($normalizedTo, '00')) {
            $normalizedTo = '+'.substr($normalizedTo, 2);
        } elseif (! str_starts_with($normalizedTo, '+')) {
            $normalizedTo = '+'.$normalizedTo;
        }

        if (! preg_match('/^\+[1-9]\d{6,14}$/', $normalizedTo)) {
            return ApiResponse::error(
                'INVALID_PHONE_FORMAT',
                'صيغة رقم المستلم غير صحيحة. يجب أن يكون بصيغة دولية صحيحة مثل +9639XXXXXXXX.',
                422
            );
        }

        // 5. Extract Message Body
        $messageText = $request->input('message')
            ?? $request->input('text')
            ?? $request->input('msg')
            ?? $request->input('body');

        if (! is_string($messageText) || trim($messageText) === '') {
            return ApiResponse::error('MESSAGE_REQUIRED', 'نص الرسالة مطلوب (message).', 422);
        }

        $idempotencyKey = $request->input('idempotency_key')
            ?? $request->header('Idempotency-Key');

        $category = (string) $request->input('category', 'transactional');

        $payload = [
            'device_id' => $device,
            'device_name' => $device,
            'device' => $device,
            'to' => $normalizedTo,
            'message' => $messageText,
            'category' => $category,
            'idempotency_key' => is_string($idempotencyKey) && trim($idempotencyKey) !== '' ? trim($idempotencyKey) : null,
        ];

        $result = $action->handle($tenant, $payload, null);

        return ApiResponse::success(
            [
                'message' => MessageResource::make($result['message']),
            ],
            202,
            ['idempotent_replay' => ! $result['created']]
        );
    }
}
