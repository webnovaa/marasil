<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->foreignId('device_id')
                ->nullable()
                ->after('tenant_id')
                ->constrained('devices')
                ->nullOnDelete();

            $table->unique('device_id');
        });
    }

    public function down(): void
    {
        Schema::table('api_keys', function (Blueprint $table): void {
            $table->dropUnique(['device_id']);
            $table->dropConstrainedForeignId('device_id');
        });
    }
};
