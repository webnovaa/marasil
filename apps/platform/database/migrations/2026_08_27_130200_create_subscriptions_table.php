<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            $table->string('status', 20);
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->timestampTz('grace_ends_at')->nullable();

            // Plan limit snapshot (immutable for this subscription)
            $table->string('plan_name');
            $table->string('plan_slug');
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

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();
            $table->boolean('auto_renew')->default(false);
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['status', 'ends_at']);
        });

        // One active subscription per tenant (PostgreSQL + SQLite partial unique index).
        DB::statement(
            "CREATE UNIQUE INDEX subscriptions_one_active_per_tenant ON subscriptions (tenant_id) WHERE status = 'active'"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
