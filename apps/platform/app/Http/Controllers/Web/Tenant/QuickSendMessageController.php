<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Services\WhatsAppServiceClient;
use App\Domain\Messaging\Actions\AcceptTextMessage;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use App\Support\Spintax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

final class QuickSendMessageController extends Controller
{
    public function __construct(
        private readonly SubscriptionGate $subscriptionGate,
        private readonly AcceptTextMessage $acceptTextMessage,
        private readonly WhatsAppServiceClient $whatsAppServiceClient,
    ) {}

    public function __invoke(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        if (! $this->subscriptionGate->canSend($tenant)) {
            return back()->with('error', 'يلزم اشتراك نشط لإرسال الرسائل عبر واتساب.');
        }

        $validated = $request->validate([
            'device_id' => ['required', 'string'],
            'recipient' => ['required', 'string', 'min:8', 'max:25'],
            'message' => ['required', 'string', 'max:4096'],
            'media_file' => ['nullable', 'file', 'max:16384'], // Max 16MB
        ]);

        $cleanRecipient = '+'.ltrim(preg_replace('/\D/', '', $validated['recipient']), '+');
        $processedText = Spintax::process($validated['message']);

        $device = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($q) use ($validated) {
                $q->where('ulid', $validated['device_id'])
                    ->orWhere('id', $validated['device_id']);
            })
            ->first();

        if ($device === null || $device->status->value !== 'connected') {
            return back()->with('error', 'الجهاز المحدد غير متصل حالياً بالشبكة.');
        }

        try {
            if ($request->hasFile('media_file')) {
                $file = $request->file('media_file');
                $path = $file->store('media/'.$tenant->ulid, 'public');
                $mediaUrl = url(Storage::url($path));
                $mime = (string) $file->getMimeType();
                $mediaType = str_starts_with($mime, 'image/')
                    ? 'image'
                    : (str_starts_with($mime, 'audio/') ? 'audio' : (str_starts_with($mime, 'video/') ? 'video' : 'document'));

                $this->whatsAppServiceClient->sendMedia([
                    'command_id' => 'cmd_'.Str::lower((string) Str::ulid()),
                    'message_id' => 'msg_'.Str::lower((string) Str::ulid()),
                    'device_id' => $device->ulid,
                    'tenant_id' => $tenant->ulid,
                    'lease_generation' => (int) $device->lease_generation,
                    'recipient' => $cleanRecipient,
                    'media_type' => $mediaType,
                    'media_url' => $mediaUrl,
                    'caption' => $processedText,
                    'file_name' => $file->getClientOriginalName(),
                    'mimetype' => $mime,
                ]);
            } else {
                $this->acceptTextMessage->handle(
                    tenant: $tenant,
                    data: [
                        'device_id' => $device->ulid,
                        'to' => $cleanRecipient,
                        'message' => $processedText,
                        'category' => 'quick_send',
                    ],
                );
            }

            return back()->with('success', 'تم إرسال الرسالة بنجاح إلى الرقم: '.$cleanRecipient);
        } catch (Throwable $e) {
            return back()->with('error', 'تعذر إرسال الرسالة: '.$e->getMessage());
        }
    }
}
