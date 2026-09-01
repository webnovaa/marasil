<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id')->nullable()->constrained()->nullOnDelete();
            $table->string('state', 16);
            $table->unsignedInteger('quantity')->default(1);
            $table->string('period_type', 16);
            $table->date('period_start');
            $table->timestampsTz();

            $table->index(['tenant_id', 'state', 'period_start']);
            $table->index(['message_id', 'state']);
        });

        Schema::create('outbox_messages', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->string('aggregate_type', 64);
            $table->string('aggregate_id', 64);
            $table->string('event_type', 64);
            $table->json('payload');
            $table->string('status', 16)->default('pending');
            $table->unsignedInteger('attempts')->default(0);
            $table->timestampTz('available_at')->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestampsTz();

            $table->index(['status', 'available_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outbox_messages');
        Schema::dropIfExists('usage_ledger');
    }
};
