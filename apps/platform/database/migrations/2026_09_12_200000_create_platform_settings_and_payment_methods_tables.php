<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 64)->unique();
            $table->text('value')->nullable();
            $table->timestampsTz();
        });

        Schema::create('payment_methods', function (Blueprint $table): void {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->string('code', 32)->unique();
            $table->string('name', 120);
            $table->string('badge', 64)->nullable();
            $table->string('address_or_code', 255);
            $table->string('account_holder', 255)->nullable();
            $table->string('network', 64)->nullable();
            $table->text('instructions')->nullable();
            $table->string('qr_payload', 512)->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(100);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('platform_settings');
    }
};
