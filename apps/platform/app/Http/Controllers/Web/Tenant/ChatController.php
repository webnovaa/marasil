<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Contacts\Models\Contact;
use App\Domain\Devices\Models\Device;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Messaging\Models\InboundMessage;
use App\Domain\Messaging\Models\Message;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

        // Fetch connected devices for sending
        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->select(['id', 'ulid', 'display_name', 'phone_e164'])
            ->get();

        // 1. Get distinct contact phones from inbound and outbound
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

        $allPhones = $inboundPhones->merge($outboundPhones)->unique()->values();

        // Load contact names from address book
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

        // Sort conversations latest first
        usort($conversations, fn ($a, $b) => strcmp((string) $b['timestamp'], (string) $a['timestamp']));

        return Inertia::render('Tenant/Chat/Index', [
            'conversations' => $conversations,
            'devices' => $devices,
        ]);
    }

    public function messages(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;
        $phone = (string) $request->query('phone');

        if (empty($phone)) {
            return response()->json(['messages' => []]);
        }

        $inbounds = InboundMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('sender_phone_e164', $phone)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id' => 'in_' . $m->id,
                'type' => 'inbound',
                'body' => $m->body,
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
            ->map(fn ($m) => [
                'id' => 'out_' . $m->id,
                'type' => 'outbound',
                'body' => $m->body,
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
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

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

            if (! $device) {
                $device = Device::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'connected')
                    ->first();
            }

            if (! $device) {
                return response()->json([
                    'error' => 'لا يوجد جهاز واتساب متصل حالياً للإرسال منه.',
                ], 422);
            }

            $message = $acceptTextMessage->handle(
                tenant: $tenant,
                data: [
                    'device_id' => $device->ulid,
                    'to' => $validated['phone'],
                    'message' => $validated['message'],
                    'category' => 'customer_support',
                ],
            );

            return response()->json([
                'success' => true,
                'message' => [
                    'id' => 'out_' . $message->id,
                    'type' => 'outbound',
                    'body' => $message->body,
                    'status' => 'pending',
                    'created_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'تعذر إرسال الرسالة: ' . $e->getMessage(),
            ], 500);
        }
    }
}
