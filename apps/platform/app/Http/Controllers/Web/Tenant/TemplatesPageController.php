<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Templates\Models\MessageTemplate;
use App\Domain\Templates\Models\TemplateVersion;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class TemplatesPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $templates = $tenant
            ? MessageTemplate::query()
                ->where('tenant_id', $tenant->id)
                ->with(['versions' => fn ($query) => $query->where('is_current', true)])
                ->orderByDesc('id')
                ->get()
                ->map(fn (MessageTemplate $template): array => [
                    'id' => $template->ulid,
                    'name' => $template->name,
                    'slug' => $template->slug,
                    'category' => $template->category,
                    'status' => $template->status,
                    'body' => $template->versions->first()?->body,
                    'version' => $template->versions->first()?->version,
                ])
            : [];

        return Inertia::render('Tenant/Templates/Index', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', 'in:otp,transactional,marketing'],
            'body' => ['required', 'string', 'max:4096'],
        ]);

        $template = MessageTemplate::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(4)),
            'category' => $data['category'],
            'status' => 'active',
        ]);

        preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $data['body'], $matches);

        TemplateVersion::query()->create([
            'message_template_id' => $template->id,
            'version' => 1,
            'body' => $data['body'],
            'variables' => array_values(array_unique($matches[1] ?? [])),
            'is_current' => true,
        ]);

        return back()->with('success', __('messages.flash.template_saved'));
    }

    public function addVersion(Request $request, string $templateUlid): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $template = MessageTemplate::query()
            ->where('ulid', $templateUlid)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        $data = $request->validate([
            'body' => ['required', 'string', 'max:4096'],
        ]);

        $currentVersion = (int) TemplateVersion::query()
            ->where('message_template_id', $template->id)
            ->max('version');

        TemplateVersion::query()
            ->where('message_template_id', $template->id)
            ->update(['is_current' => false]);

        preg_match_all('/\{\{([a-zA-Z0-9_]+)\}\}/', $data['body'], $matches);

        TemplateVersion::query()->create([
            'message_template_id' => $template->id,
            'version' => $currentVersion + 1,
            'body' => $data['body'],
            'variables' => array_values(array_unique($matches[1] ?? [])),
            'is_current' => true,
        ]);

        return back()->with('success', __('messages.flash.template_version_created'));
    }
}
