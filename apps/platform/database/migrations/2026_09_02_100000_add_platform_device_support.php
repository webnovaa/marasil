<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->boolean('is_platform')->default(false)->after('tenant_id');
            $table->string('avatar_path')->nullable()->after('display_name');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->index('is_platform');
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropIndex(['is_platform']);
            $table->dropColumn(['is_platform', 'avatar_path']);
        });
    }
};
