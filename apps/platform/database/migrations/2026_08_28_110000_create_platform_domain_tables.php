<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('in_app_notifications', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 64);
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->string('dedupe_key', 120)->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampsTz();

            $table->index(['user_id', 'read_at']);
            $table->unique(['user_id', 'dedupe_key']);
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('in_app_enabled')->default(true);
            $table->boolean('security_critical_enabled')->default(true);
            $table->boolean('usage_alerts_enabled')->default(true);
            $table->boolean('device_alerts_enabled')->default(true);
            $table->timestampsTz();

            $table->unique('user_id');
        });

        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_e164', 20);
            $table->string('category', 32);
            $table->string('status', 16)->default('granted');
            $table->timestampTz('granted_at')->nullable();
            $table->timestampTz('revoked_at')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'recipient_e164', 'category']);
        });

        Schema::create('suppression_entries', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_e164', 20);
            $table->string('reason', 64)->default('opt_out');
            $table->timestampTz('suppressed_until')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'recipient_e164']);
        });

        Schema::create('quiet_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->time('starts_at')->default('22:00:00');
            $table->time('ends_at')->default('08:00:00');
            $table->string('timezone', 64)->default('Asia/Damascus');
            $table->timestampsTz();

            $table->unique('tenant_id');
        });

        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('category', 32)->default('transactional');
            $table->string('status', 16)->default('active');
            $table->timestampsTz();

            $table->unique(['tenant_id', 'slug']);
        });

        Schema::create('template_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_template_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->text('body');
            $table->json('variables')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestampsTz();

            $table->unique(['message_template_id', 'version']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number', 40);
            $table->string('status', 16)->default('issued');
            $table->unsignedInteger('amount_minor');
            $table->string('currency', 8)->default('USD');
            $table->string('payment_method', 32)->nullable();
            $table->string('payment_reference', 120)->nullable();
            $table->timestampTz('issued_at')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'number']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('amount_minor');
            $table->unsignedInteger('quantity')->default(1);
            $table->timestampsTz();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('subject');
            $table->string('status', 16)->default('open');
            $table->string('priority', 16)->default('normal');
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_staff')->default(false);
            $table->timestampsTz();
        });

        Schema::create('team_invites', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->string('phone_e164', 20);
            $table->string('role', 40)->default('tenant_member');
            $table->string('token_hash', 64);
            $table->string('status', 16)->default('pending');
            $table->timestampTz('expires_at');
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('enabled')->default(false);
            $table->json('payload')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('team_invites');
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('template_versions');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('quiet_hours');
        Schema::dropIfExists('suppression_entries');
        Schema::dropIfExists('consents');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('in_app_notifications');
    }
};
