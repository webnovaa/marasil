<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Campaigns\Jobs\ProcessCampaignJob;
use App\Domain\Campaigns\Models\Campaign;
use App\Domain\Campaigns\Models\CampaignRecipient;
use App\Domain\Contacts\Models\Contact;
use App\Domain\Contacts\Models\ContactGroup;
use App\Domain\Devices\Models\Device;
use App\Domain\Subscriptions\Services\SubscriptionGate;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CampaignsController extends Controller
{
    public function __construct(
        private readonly SubscriptionGate $subscriptionGate,
    ) {}

    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $campaigns = Campaign::query()
            ->where('tenant_id', $tenant->id)
            ->withCount('recipients')
            ->latest()
            ->paginate(15);

        return Inertia::render('Tenant/Campaigns/Index', [
            'campaigns' => $campaigns->items(),
            'pagination' => [
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
                'per_page' => $campaigns->perPage(),
                'total' => $campaigns->total(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        $devices = Device::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'connected')
            ->select(['id', 'ulid', 'display_name', 'phone_e164'])
            ->get();

        $groups = ContactGroup::query()
            ->where('tenant_id', $tenant->id)
            ->withCount('contacts')
            ->get();

        return Inertia::render('Tenant/Campaigns/Create', [
            'devices' => $devices,
            'groups' => $groups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->requirePrimaryTenant();

        if (! $this->subscriptionGate->canSend($tenant)) {
            return back()->with('error', 'يلزم اشتراك نشط لإطلاق الحملات.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'device_ids' => ['required', 'array', 'min:1'],
            'device_ids.*' => ['string'],
            'message_template' => ['required', 'string', 'max:4096'],
            'min_delay_seconds' => ['required', 'integer', 'min:2', 'max:60'],
            'max_delay_seconds' => ['required', 'integer', 'min:3', 'max:120'],
            'group_id' => ['nullable', 'exists:contact_groups,id'],
            'manual_numbers' => ['nullable', 'string'],
        ]);

        $campaign = Campaign::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'status' => 'draft',
            'device_ids' => $validated['device_ids'],
            'message_template' => $validated['message_template'],
            'min_delay_seconds' => $validated['min_delay_seconds'],
            'max_delay_seconds' => $validated['max_delay_seconds'],
        ]);

        $recipientsData = [];

        // Add from group
        if (! empty($validated['group_id'])) {
            $contacts = Contact::query()
                ->where('tenant_id', $tenant->id)
                ->where('group_id', $validated['group_id'])
                ->get();

            foreach ($contacts as $contact) {
                $recipientsData[] = [
                    'campaign_id' => $campaign->id,
                    'ulid' => (string) \Illuminate\Support\Str::ulid(),
                    'phone_e164' => $contact->phone_e164,
                    'recipient_name' => $contact->name,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Add manual numbers
        if (! empty($validated['manual_numbers'])) {
            $lines = preg_split('/[\r\n,]+/', $validated['manual_numbers']);
            foreach ($lines as $line) {
                $clean = '+'.ltrim(preg_replace('/\D/', '', $line), '+');
                if (strlen($clean) >= 9) {
                    $recipientsData[] = [
                        'campaign_id' => $campaign->id,
                        'ulid' => (string) \Illuminate\Support\Str::ulid(),
                        'phone_e164' => $clean,
                        'recipient_name' => null,
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (count($recipientsData) > 0) {
            CampaignRecipient::query()->insert($recipientsData);
            $campaign->update(['total_recipients' => count($recipientsData)]);
        }

        // Dispatch background worker
        ProcessCampaignJob::dispatch($campaign->id);

        return redirect()->route('campaigns.show', $campaign->ulid)->with('success', 'تم إنشاء الحملة وبدء الإرسال في الخلفية.');
    }

    public function show(Campaign $campaign): Response
    {
        $campaign->load(['tenant']);
        $recipients = CampaignRecipient::query()
            ->where('campaign_id', $campaign->id)
            ->with('device')
            ->latest()
            ->paginate(30);

        return Inertia::render('Tenant/Campaigns/Show', [
            'campaign' => $campaign,
            'recipients' => $recipients->items(),
            'pagination' => [
                'current_page' => $recipients->currentPage(),
                'last_page' => $recipients->lastPage(),
                'per_page' => $recipients->perPage(),
                'total' => $recipients->total(),
            ],
        ]);
    }

    public function pause(Campaign $campaign): RedirectResponse
    {
        $campaign->update(['status' => 'paused']);
        return back()->with('success', 'تم إيقاف الحملة مؤقتاً.');
    }

    public function resume(Campaign $campaign): RedirectResponse
    {
        $campaign->update(['status' => 'running']);
        ProcessCampaignJob::dispatch($campaign->id);
        return back()->with('success', 'تم استئناف تشغيل الحملة.');
    }
}
