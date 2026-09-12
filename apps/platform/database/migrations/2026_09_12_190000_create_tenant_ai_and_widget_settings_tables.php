<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_ai_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('gemini_api_key')->nullable();
            $table->string('model', 64)->default('gemini-1.5-flash');
            $table->string('company_name', 128)->nullable();
            $table->text('company_bio')->nullable();
            $table->text('products_services')->nullable();
            $table->text('working_hours')->nullable();
            $table->text('policies')->nullable();
            $table->text('system_instruction')->nullable();
            $table->string('tone', 32)->default('friendly'); // friendly, professional, sales, formal
            $table->boolean('is_enabled')->default(false);
            $table->decimal('temperature', 3, 2)->default(0.70);
            $table->unsignedInteger('max_tokens')->default(1000);
            $table->unsignedInteger('total_ai_replies')->default(0);
            $table->timestampsTz();
        });

        Schema::create('tenant_widget_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone_number', 32)->nullable();
            $table->string('brand_name', 128)->default('مراسيل');
            $table->text('greeting_message')->nullable();
            $table->text('welcome_popup_text')->nullable();
            $table->string('button_color', 16)->default('#25D366');
            $table->string('position', 32)->default('bottom-right');
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_widget_settings');
        Schema::dropIfExists('tenant_ai_settings');
    }
};
