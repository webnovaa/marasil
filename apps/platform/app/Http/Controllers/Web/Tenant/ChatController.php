<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Contacts\Models\Contact;
use App\Domain\Devices\Enums\DeviceStatus;
use App\Domain\Devices\Models\Device;
use App\Domain\Identity\Models\User;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Messaging\Models\InboundMessage;
use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $tenant = $this->tenantOrAbort($request);

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', DeviceStatus::Connected)
            ->orderBy('name')
            ->get(['id', 'ulid', 'name', 'display_name', 'phone_e164'])
            ->map(fn (Device $device): array => [
                'id' => $device->id,
                'ulid' => $device->ulid,
                'display_name' => $device->display_name ?: $device->name,
                'phone_e164' => $device->phone_e164,
            ])
            ->values();

        $inboundPhones = InboundMessage::query()
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->limit(100)
            ->pluck('sender_phone_e164')
            ->unique();

        $outboundPhones = Message::query()
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->limit(100)
            ->pluck('recipient_e164')
            ->unique();

        $allPhones = $inboundPhones->merge($outboundPhones)->filter()->unique()->values();

        $contactsMap = Contact::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('phone_e164', $allPhones)
            ->pluck('name', 'phone_e164');

        $conversations = [];
        foreach ($allPhones as $phone) {
            $lastInbound = InboundMessage::query()
                ->where('tenant_id', $tenant->id)
                ->where('sender_phone_e164', $phone)
                ->latest('id')
                ->first();

            $lastOutbound = Message::query()
                ->where('tenant_id', $tenant->id)
                ->where('recipient_e164', $phone)
                ->latest('id')
                ->first();

            $lastMsg = null;
            $direction = 'outbound';
            $timestamp = null;

            if ($lastInbound && $lastOutbound) {
                if ($lastInbound->created_at >= $lastOutbound->created_at) {
                    $lastMsg = $lastInbound->body;
                    $direction = 'inbound';
                    $timestamp = $lastInbound->created_at;
                } else {
                    $lastMsg = $lastOutbound->body;
                    $direction = 'outbound';
                    $timestamp = $lastOutbound->created_at;
                }
            } elseif ($lastInbound) {
                $lastMsg = $lastInbound->body;
                $direction = 'inbound';
                $timestamp = $lastInbound->created_at;
            } elseif ($lastOutbound) {
                $lastMsg = $lastOutbound->body;
                $direction = 'outbound';
                $timestamp = $lastOutbound->created_at;
            }

            $conversations[] = [
                'phone' => (string) $phone,
                'name' => $contactsMap->get($phone) ?? $lastInbound?->push_name ?? (string) $phone,
                'last_message' => (string) ($lastMsg ?? ''),
                'direction' => $direction,
                'timestamp' => $timestamp?->toIso8601String(),
                'unread' => $direction === 'inbound',
            ];
        }

        usort(
            $conversations,
            fn (array $a, array $b): int => strcmp((string) ($b['timestamp'] ?? ''), (string) ($a['timestamp'] ?? '')),
        );

        return Inertia::render('Tenant/Chat/Index', [
            'conversations' => $conversations,
            'devices' => $devices,
        ]);
    }

    public function messages(Request $request): JsonResponse
    {
        $tenant = $this->tenantOrAbort($request);
        $phone = (string) $request->query('phone');

        if ($phone === '') {
            return response()->json(['messages' => []]);
        }

        $inbounds = InboundMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('sender_phone_e164', $phone)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (InboundMessage $m): array => [
                'id' => 'in_'.$m->id,
                'type' => 'inbound',
                'body' => (string) ($m->body ?? ''),
                'status' => 'received',
                'created_at' => $m->created_at?->toIso8601String(),
                'timestamp' => $m->created_at?->timestamp ?? 0,
            ]);

        $outbounds = Message::query()
            ->where('tenant_id', $tenant->id)
            ->where('recipient_e164', $phone)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Message $m): array => [
                'id' => 'out_'.$m->id,
                'type' => 'outbound',
                'body' => (string) ($m->body ?? ''),
                'status' => $m->status?->value ?? 'sent',
                'created_at' => $m->created_at?->toIso8601String(),
                'timestamp' => $m->created_at?->timestamp ?? 0,
            ]);

        $allMessages = $inbounds->merge($outbounds)->sortBy('timestamp')->values()->all();

        return response()->json([
            'messages' => $allMessages,
        ]);
    }

    public function send(Request $request, AcceptTextMessage $acceptTextMessage): JsonResponse
    {
        $tenant = $this->tenantOrAbort($request);

        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['required', 'string', 'max:4096'],
            'device_id' => ['nullable', 'string'],
        ]);

        try {
            $device = null;
            if (! empty($validated['device_id'])) {
                $device = Device::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('ulid', $validated['device_id'])
                    ->first();
            }

            if ($device === null) {
                $device = Device::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('status', DeviceStatus::Connected)
                    ->first();
            }

            if ($device === null) {
                return response()->json([
                    'error' => 'لا يوجد جهاز واتساب متصل حالياً للإرسال منه.',
                ], 422);
            }

            $result = $acceptTextMessage->handle(
                $tenant,
                [
                    'device_id' => $device->ulid,
                    'to' => $validated['phone'],
                    'message' => $validated['message'],
                    'category' => 'transactional',
                ],
            );

            $message = $result['message'];

            return response()->json([
                'success' => true,
                'message' => [
                    'id' => 'out_'.$message->id,
                    'type' => 'outbound',
                    'body' => (string) ($message->body ?? $validated['message']),
                    'status' => $message->status?->value ?? 'queued',
                    'created_at' => $message->created_at?->toIso8601String() ?? now()->toIso8601String(),
                ],
            ], 202);
        } catch (HttpResponseException $e) {
            $response = $e->getResponse();
            $payload = json_decode((string) $response->getContent(), true);
            $message = is_array($payload)
                ? (string) ($payload['error']['message'] ?? $payload['message'] ?? 'تعذر إرسال الرسالة.')
                : 'تعذر إرسال الرسالة.';

            return response()->json(['error' => $message], $response->getStatusCode());
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'تعذر إرسال الرسالة. حاول مجدداً بعد قليل.',
            ], 500);
        }
    }

    private function tenantOrAbort(Request $request): Tenant
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403, 'No tenant available.');

        return $tenant;
    }
}
