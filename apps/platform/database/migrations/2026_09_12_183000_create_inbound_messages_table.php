<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inbound_messages', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('sender_phone_e164', 20);
            $table->string('provider_message_id', 128)->nullable();
            $table->text('body');
            $table->string('push_name', 128)->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestampTz('received_at')->useCurrent();
            $table->timestampsTz();

            $table->index(['tenant_id', 'sender_phone_e164']);
            $table->index(['device_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inbound_messages');
    }
};
