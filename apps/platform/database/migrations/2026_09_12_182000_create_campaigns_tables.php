<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('status', 32)->default('draft'); // draft, running, paused, completed, failed
            $table->json('device_ids')->nullable(); // Array of device IDs to rotate across
            $table->text('message_template');
            $table->unsignedSmallInteger('min_delay_seconds')->default(5);
            $table->unsignedSmallInteger('max_delay_seconds')->default(15);
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestampTz('scheduled_at')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->string('phone_e164', 20);
            $table->string('recipient_name', 128)->nullable();
            $table->string('status', 32)->default('pending'); // pending, sent, failed
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampsTz();

            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_recipients');
        Schema::dropIfExists('campaigns');
    }
};
