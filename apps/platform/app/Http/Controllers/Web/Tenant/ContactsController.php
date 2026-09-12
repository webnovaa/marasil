<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Contacts\Models\Contact;
use App\Domain\Contacts\Models\ContactGroup;
use App\Domain\Tenancy\Models\Tenant;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ContactsController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

        $search = (string) $request->query('search', '');
        $groupId = $request->query('group_id');

        $groups = ContactGroup::query()
            ->where('tenant_id', $tenant->id)
            ->withCount('contacts')
            ->get();

        $contacts = Contact::query()
            ->where('tenant_id', $tenant->id)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('phone_e164', 'like', "%{$search}%");
                });
            })
            ->when($groupId, fn ($q) => $q->where('group_id', $groupId))
            ->with('group')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tenant/Contacts/Index', [
            'contacts' => $contacts->items(),
            'groups' => $groups,
            'filters' => [
                'search' => $search,
                'group_id' => $groupId,
            ],
            'pagination' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'phone' => ['required', 'string', 'min:8', 'max:25'],
            'group_id' => ['nullable', 'exists:contact_groups,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $phone = '+'.ltrim(preg_replace('/\D/', '', $validated['phone']), '+');

        Contact::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'phone_e164' => $phone],
            [
                'name' => $validated['name'],
                'group_id' => $validated['group_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return back()->with('success', 'تم حفظ جهة الاتصال بنجاح.');
    }

    public function storeGroup(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        ContactGroup::query()->create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#10b981',
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'تم إنشاء المجموعة بنجاح.');
    }

    public function import(Request $request): RedirectResponse
    {
        /** @var Tenant $tenant */
        $tenant = $request->user()->tenant;

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
            'group_id' => ['nullable', 'exists:contact_groups,id'],
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        if (! $handle) {
            return back()->with('error', 'تعذر قراءة ملف CSV.');
        }

        $imported = 0;
        $groupId = $request->input('group_id');

        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            if (count($row) < 2) {
                continue;
            }
            $name = trim($row[0]);
            $rawPhone = trim($row[1]);
            $cleanPhone = '+'.ltrim(preg_replace('/\D/', '', $rawPhone), '+');

            if (strlen($cleanPhone) >= 9) {
                Contact::query()->updateOrCreate(
                    ['tenant_id' => $tenant->id, 'phone_e164' => $cleanPhone],
                    [
                        'name' => $name ?: 'عميل',
                        'group_id' => $groupId ?: null,
                    ],
                );
                $imported++;
            }
        }
        fclose($handle);

        return back()->with('success', "تم استيراد {$imported} جهة اتصال بنجاح.");
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        $contact->delete();
        return back()->with('success', 'تم حذف جهة الاتصال.');
    }
}
