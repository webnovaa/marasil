<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table): void {
            $table->boolean('message_alerts_enabled')->default(true)->after('device_alerts_enabled');
            $table->boolean('whatsapp_alerts_enabled')->default(true)->after('message_alerts_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table): void {
            $table->dropColumn(['message_alerts_enabled', 'whatsapp_alerts_enabled']);
        });
    }
};
