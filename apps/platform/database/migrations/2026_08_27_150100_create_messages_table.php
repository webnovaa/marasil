<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->restrictOnDelete();
            $table->foreignId('api_key_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 128)->nullable();
            $table->string('recipient_e164', 20);
            $table->string('type', 32)->default('text');
            $table->text('content_encrypted')->nullable();
            $table->string('media_path')->nullable();
            $table->text('caption')->nullable();
            $table->string('status', 32)->default('queued');
            $table->string('provider_message_id')->nullable();
            $table->unsignedSmallInteger('priority')->default(0);
            $table->timestampTz('scheduled_at')->nullable();
            $table->timestampTz('queued_at')->nullable();
            $table->timestampTz('processing_at')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('failed_at')->nullable();
            $table->string('error_code', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->string('request_id', 64)->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'idempotency_key']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['device_id', 'status']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
