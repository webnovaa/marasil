<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table): void {
            $table->string('display_name')->nullable()->after('phone_e164');
            $table->string('lease_owner')->nullable()->after('worker_id');
            $table->unsignedBigInteger('lease_generation')->default(0)->after('lease_owner');
            $table->timestampTz('lease_expires_at')->nullable()->after('lease_generation');
            $table->foreignId('created_by')->nullable()->after('tenant_id')->constrained('users')->nullOnDelete();
            $table->timestampTz('last_error_at')->nullable()->after('last_error_message');
            $table->index(['lease_expires_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table): void {
            $table->dropIndex(['lease_expires_at', 'status']);
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['display_name', 'lease_owner', 'lease_generation', 'lease_expires_at', 'last_error_at']);
        });
    }
};
