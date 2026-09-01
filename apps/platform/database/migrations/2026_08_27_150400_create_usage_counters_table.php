<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_counters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('period_type', 16);
            $table->date('period_start');
            $table->unsignedBigInteger('messages_accepted')->default(0);
            $table->unsignedBigInteger('messages_sent')->default(0);
            $table->unsignedBigInteger('messages_failed')->default(0);
            $table->unsignedBigInteger('media_bytes')->default(0);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'device_id', 'period_type', 'period_start'], 'usage_counters_unique_period');
            $table->index(['tenant_id', 'period_type', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_counters');
    }
};
