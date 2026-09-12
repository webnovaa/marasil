<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_replies', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 128);
            $table->string('trigger_type', 32)->default('contains'); // exact, contains, starts_with, welcome
            $table->string('trigger_keyword', 255)->nullable();
            $table->text('reply_text');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('reply_count')->default(0);
            $table->timestampsTz();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['device_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_replies');
    }
};
