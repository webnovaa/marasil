<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->string('worker_id')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('finished_at')->nullable();
            $table->string('status', 32)->default('started');
            $table->string('error_code', 64)->nullable();
            $table->string('error_class')->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('next_retry_at')->nullable();
            $table->timestampsTz();

            $table->unique(['message_id', 'attempt_number']);
            $table->index(['message_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_attempts');
    }
};
