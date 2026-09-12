<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_groups', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('color', 20)->default('#10b981');
            $table->string('description', 255)->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'name']);
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('contact_groups')->nullOnDelete();
            $table->string('name', 128);
            $table->string('phone_e164', 20);
            $table->boolean('is_whatsapp_verified')->default(false);
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'phone_e164']);
            $table->index(['tenant_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('contact_groups');
    }
};
