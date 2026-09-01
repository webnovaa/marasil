<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone_e164', 20)->nullable();
            $table->string('provider', 40)->default('baileys');
            $table->string('status', 32)->default('creating');
            $table->string('worker_id')->nullable();
            $table->unsignedInteger('session_version')->default(1);
            $table->timestampTz('last_connected_at')->nullable();
            $table->timestampTz('last_disconnected_at')->nullable();
            $table->timestampTz('last_heartbeat_at')->nullable();
            $table->string('disconnect_reason')->nullable();
            $table->string('last_error_code', 64)->nullable();
            $table->text('last_error_message')->nullable();
            $table->unsignedInteger('daily_limit_override')->nullable();
            $table->json('settings')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'phone_e164']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
