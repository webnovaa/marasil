<?php

namespace Tests\Feature;

use App\Domain\Messaging\Enums\MessageType;
use App\Domain\Messaging\Models\Message;
use App\Domain\Messaging\Services\MessageTransportPayload;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class MessageTransportPayloadTest extends TestCase
{
    public function test_text_remains_backwards_compatible(): void
    {
        $message = new Message(['type' => MessageType::Text, 'content_encrypted' => 'Hello']);
        $this->assertSame(['text' => 'Hello'], app(MessageTransportPayload::class)->content($message));
    }

    public function test_media_bytes_are_read_from_private_storage(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('tenants/test/media/receipt.pdf', '%PDF-1.4 receipt');
        $message = new Message([
            'type' => MessageType::Document,
            'media_path' => 'local:tenants/test/media/receipt.pdf',
            'caption' => 'Your receipt',
        ]);
        $payload = app(MessageTransportPayload::class)->content($message);
        $this->assertSame('document', $payload['type']);
        $this->assertSame('%PDF-1.4 receipt', base64_decode($payload['media']['data']));
        $this->assertSame('Your receipt', $payload['media']['caption']);
        $this->assertArrayNotHasKey('text', $payload);
    }

    public function test_missing_media_is_not_sent_as_empty_text(): void
    {
        $this->expectException(\RuntimeException::class);
        app(MessageTransportPayload::class)->content(new Message(['type' => MessageType::Image]));
    }
}
