<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_request_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('amount_minor')->default(0);
            $table->char('currency', 3)->default('USD');
            $table->string('provider', 60)->default('manual');
            $table->string('provider_reference', 120)->nullable();
            $table->string('status', 20)->default('pending');
            $table->string('proof_path')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('failed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
