<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->char('currency', 3)->default('USD');
            $table->unsignedInteger('duration_days')->nullable();
            $table->unsignedInteger('max_devices')->default(1);
            $table->unsignedInteger('monthly_message_limit')->default(0);
            $table->unsignedInteger('daily_message_limit_per_device')->default(0);
            $table->unsignedInteger('max_api_keys')->default(1);
            $table->unsignedInteger('max_webhooks')->default(0);
            $table->unsignedInteger('max_media_size_mb')->default(16);
            $table->boolean('allow_media')->default(false);
            $table->boolean('allow_priority_queue')->default(false);
            $table->boolean('allow_team_members')->default(false);
            $table->json('features')->nullable();
            $table->boolean('is_public')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['is_public', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
