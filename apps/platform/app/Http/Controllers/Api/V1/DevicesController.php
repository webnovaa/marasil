<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\ApiKeys\Actions\ProvisionDeviceApiKey;
use App\Domain\Devices\Actions\ConnectDevice;
use App\Domain\Devices\Actions\CreateDevice;
use App\Domain\Devices\Actions\DeleteDevice;
use App\Domain\Devices\Actions\DisconnectDevice;
use App\Domain\Devices\Actions\LogoutDevice;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Http\Resources\MessageResource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Devices\StoreDeviceRequest;
use App\Http\Requests\Devices\UpdateDeviceRequest;
use App\Http\Resources\DeviceIntegrationResource;
use App\Http\Resources\DeviceResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DevicesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', Device::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('id')
            ->get();

        return ApiResponse::success(['devices' => DeviceResource::collection($devices)]);
    }

    public function store(StoreDeviceRequest $request, CreateDevice $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('create', Device::class);

        $tenant = $user->primaryTenant();
        if ($tenant === null) {
            return ApiResponse::error('FORBIDDEN', 'No tenant available.', 403);
        }

        $result = $action->handle($tenant, $request->validated());
        $device = $result['device']->load(['tenant', 'apiKey']);
        $tenantModel = $device->tenant ?? $tenant;

        return ApiResponse::success([
            'device' => DeviceResource::make($device),
            'integration' => DeviceIntegrationResource::make(
                $device,
                $tenantModel,
                $device->apiKey,
                $result['integration_key'],
            ),
        ], 201);
    }

    public function show(Request $request, Device $device, ProvisionDeviceApiKey $provisionDeviceApiKey): JsonResponse
    {
        $this->authorize('view', $device);

        $device->load(['tenant', 'apiKey']);
        $provisioned = $provisionDeviceApiKey->ensure($device);
        $device->load('apiKey');

        return ApiResponse::success([
            'device' => DeviceResource::make($device),
            'integration' => DeviceIntegrationResource::make(
                $device,
                $device->tenant,
                $device->apiKey,
                $provisioned['created'] ? $provisioned['plain_text_key'] : null,
            ),
        ]);
    }

    public function rotateIntegrationKey(Request $request, Device $device, ProvisionDeviceApiKey $provisionDeviceApiKey): JsonResponse
    {
        $this->authorize('update', $device);

        $device->load(['tenant', 'apiKey']);
        $rotated = $provisionDeviceApiKey->rotate($device);
        $device->load('apiKey');

        return ApiResponse::success([
            'integration' => DeviceIntegrationResource::make(
                $device,
                $device->tenant,
                $rotated['api_key'],
                $rotated['plain_text_key'],
            ),
        ]);
    }

    public function update(UpdateDeviceRequest $request, Device $device): JsonResponse
    {
        $this->authorize('update', $device);

        $device->fill($request->validated());
        $device->save();

        return ApiResponse::success(['device' => DeviceResource::make($device->fresh() ?? $device)]);
    }

    public function destroy(Request $request, Device $device, DeleteDevice $action): JsonResponse
    {
        $this->authorize('delete', $device);
        $action->handle($device);

        return ApiResponse::success(['deleted' => true]);
    }

    public function connect(Request $request, Device $device, ConnectDevice $action): JsonResponse
    {
        $this->authorize('connect', $device);
        $device = $action->handle($device);

        return ApiResponse::success(['device' => DeviceResource::make($device)], 202);
    }

    public function disconnect(Request $request, Device $device, DisconnectDevice $action): JsonResponse
    {
        $this->authorize('disconnect', $device);
        $device = $action->handle($device);

        return ApiResponse::success(['device' => DeviceResource::make($device)]);
    }

    public function logout(Request $request, Device $device, LogoutDevice $action): JsonResponse
    {
        $this->authorize('logout', $device);
        $device = $action->handle($device);

        return ApiResponse::success(['device' => DeviceResource::make($device)]);
    }

    public function testMessage(Request $request, Device $device, AcceptTextMessage $action): JsonResponse
    {
        $this->authorize('view', $device);
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null || (int) $tenant->id !== (int) $device->tenant_id, 404);
        $validated = $request->validate([
            'to' => ['required', 'string', 'regex:/^\+[1-9]\d{7,14}$/'],
            'message' => ['required', 'string', 'max:4096'],
            'consent_confirmed' => ['accepted'],
        ]);
        $validated['device_id'] = $device->ulid;
        $validated['idempotency_key'] = $request->header('Idempotency-Key');

        try {
            $result = $action->handle($tenant, $validated);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return ApiResponse::error(
                'TEST_MESSAGE_FAILED',
                'تعذر قبول رسالة الاختبار. تحقق من اتصال الجهاز والطابور ثم أعد المحاولة.',
                502,
            );
        }

        return ApiResponse::success(
            ['message' => MessageResource::make($result['message'])],
            202,
            ['idempotent_replay' => ! $result['created']],
        );
    }

    public function socketToken(Request $request, Device $device): JsonResponse
    {
        $this->authorize('view', $device);
        $secret = (string) config('whatsapp.socket_token_secret');
        abort_if($secret === '', 503, 'Realtime authentication is not configured.');
        /** @var User $user */
        $user = $request->user();
        $ttl = min(120, max(30, (int) config('whatsapp.socket_token_ttl_seconds', 90)));
        $claims = [
            'tenant_id' => $device->tenant?->ulid,
            'user_id' => $user->ulid,
            'device_id' => $device->ulid,
            'purpose' => 'device-realtime',
            'exp' => now()->addSeconds($ttl)->timestamp,
        ];
        $payload = rtrim(strtr(base64_encode((string) json_encode($claims, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
        $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, $secret, true)), '+/', '-_'), '=');

        return ApiResponse::success(['token' => $payload.'.'.$signature, 'expires_in' => $ttl]);
    }

    public function pairingCode(Request $request, Device $device, WhatsAppServiceClient $client): JsonResponse
    {
        $this->authorize('connect', $device);

        $validated = $request->validate([
            'phone_number' => ['required', 'string'],
        ]);

        $phoneNumber = preg_replace('/[^\d]/', '', $validated['phone_number']) ?? '';

        if (strlen($phoneNumber) < 7) {
            return ApiResponse::error('INVALID_PHONE', 'يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة.', 422);
        }

        try {
            $device->load('tenant');

            $result = $client->requestPairingCode($device->ulid, [
                'phone_number' => $phoneNumber,
                'tenant_id' => $device->tenant?->ulid,
                'lease_generation' => (int) $device->lease_generation,
            ]);

            $code = $result['data']['pairing_code'] ?? $result['pairing_code'] ?? null;

            if ($code === null) {
                return ApiResponse::error('PAIRING_FAILED', 'تعذر استخراج كود الربط من السيرفر. تأكد من تشغيل محرك Baileys.', 503);
            }

            return ApiResponse::success([
                'pairing_code' => $code,
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::error('PAIRING_FAILED', 'تعذر طلب كود الربط: '.$e->getMessage(), 500);
        }
    }

    public function checkNumber(Request $request, Device $device, WhatsAppServiceClient $client): JsonResponse
    {
        $this->authorize('view', $device);

        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $phoneNumber = preg_replace('/[^\d]/', '', $validated['phone']) ?? '';

        if (strlen($phoneNumber) < 7) {
            return ApiResponse::error('INVALID_PHONE', 'يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة.', 422);
        }

        try {
            $result = $client->checkNumber($device->ulid, [
                'phone_number' => $phoneNumber,
            ]);

            $data = $result['data'] ?? $result;
            $exists = (bool) ($data['exists'] ?? false);

            return ApiResponse::success([
                'phone' => '+'.$phoneNumber,
                'exists' => $exists,
                'status' => $exists ? 'valid' : 'not_registered',
                'device' => $device->name,
                'message' => $exists
                    ? 'الرقم يملك حساب واتساب نشط وجاهز لاستقبال الرسائل'
                    : 'الرقم غير مسجل على واتساب',
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::error('CHECK_FAILED', 'تعذر فحص الرقم: '.$e->getMessage(), 500);
        }
    }
}
