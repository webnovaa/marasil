<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Models\User;
use App\Domain\Notifications\Services\NotificationService;
use App\Domain\Templates\Models\MessageTemplate;
use App\Domain\Templates\Models\TemplateVersion;
use App\Domain\Templates\Services\TemplateRenderer;
use App\Domain\Tenancy\Actions\CreateTenantForOwner;
use App\Domain\Tenancy\Enums\TenantStatus;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class NotificationsAndTemplatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_notification_dedupe_does_not_create_duplicates(): void
    {
        $user = User::factory()->create(['status' => UserStatus::Active]);
        $service = app(NotificationService::class);

        $first = $service->notify($user, 'usage.80', 'استخدام', 'وصلت إلى 80%', [], 'usage-80-'.$user->id);
        $second = $service->notify($user, 'usage.80', 'استخدام', 'وصلت إلى 80%', [], 'usage-80-'.$user->id);

        $this->assertNotNull($first);
        $this->assertSame($first?->id, $second?->id);
        $this->assertSame(1, $service->unreadCount($user));
    }

    public function test_template_renderer_rejects_unknown_variables_and_renders_safe_values(): void
    {
        $owner = User::factory()->create(['status' => UserStatus::Active]);
        $tenant = app(CreateTenantForOwner::class)->handle($owner, 'Templates', TenantStatus::Active);

        $template = MessageTemplate::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'OTP',
            'slug' => 'otp',
            'category' => 'otp',
            'status' => 'active',
        ]);

        TemplateVersion::query()->create([
            'message_template_id' => $template->id,
            'version' => 1,
            'body' => 'رمزك هو {{code}}',
            'variables' => ['code'],
            'is_current' => true,
        ]);

        $renderer = app(TemplateRenderer::class);
        $this->assertSame('رمزك هو 123456', $renderer->render($template, ['code' => '123456']));

        try {
            $renderer->render($template, ['code' => '1', 'eval' => 'nope']);
            $this->fail('Unknown variables should be rejected.');
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            $payload = $e->getResponse()->getData(true);
            $this->assertSame('TEMPLATE_VARIABLE_INVALID', $payload['error']['code']);
        }
    }
}
