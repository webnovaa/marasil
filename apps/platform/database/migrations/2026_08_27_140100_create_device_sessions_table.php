<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('encrypted_data')->nullable();
            $table->text('encrypted_data_key')->nullable();
            $table->unsignedInteger('encryption_key_version')->default(1);
            $table->string('nonce', 64)->nullable();
            $table->string('auth_tag', 64)->nullable();
            $table->unsignedInteger('credentials_version')->default(1);
            $table->timestampTz('rotated_at')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_sessions');
    }
};
