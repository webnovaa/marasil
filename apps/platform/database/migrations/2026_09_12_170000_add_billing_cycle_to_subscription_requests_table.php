<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_requests', function (Blueprint $table) {
            $table->string('billing_cycle', 20)->default('monthly')->after('type');
            $table->unsignedBigInteger('amount_minor')->nullable()->after('billing_cycle');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_requests', function (Blueprint $table) {
            $table->dropColumn(['billing_cycle', 'amount_minor']);
        });
    }
};
