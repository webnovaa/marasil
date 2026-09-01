<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Tenant;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\TeamInvite;
use App\Domain\Tenancy\Models\TenantMember;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class TeamPageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();

        $members = $tenant
            ? TenantMember::query()
                ->with('user.profile')
                ->where('tenant_id', $tenant->id)
                ->get()
                ->map(fn (TenantMember $member): array => [
                    'id' => $member->id,
                    'role' => $member->role,
                    'status' => $member->status instanceof \BackedEnum ? $member->status->value : (string) $member->status,
                    'name' => $member->user?->profile?->full_name,
                    'phone_e164' => $member->user?->phone_e164,
                ])
            : [];

        $invites = $tenant
            ? TeamInvite::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'pending')
                ->orderByDesc('id')
                ->get()
                ->map(fn (TeamInvite $invite): array => [
                    'id' => $invite->ulid,
                    'phone_e164' => $invite->phone_e164,
                    'role' => $invite->role,
                    'expires_at' => $invite->expires_at?->toIso8601String(),
                ])
            : [];

        return Inertia::render('Tenant/Team/Index', [
            'members' => $members,
            'invites' => $invites,
        ]);
    }

    public function invite(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $tenant = $user->primaryTenant();
        abort_if($tenant === null, 403);

        $data = $request->validate([
            'phone_e164' => ['required', 'string', 'regex:/^\+[1-9]\d{6,14}$/'],
            'role' => ['required', 'in:tenant_member,tenant_owner'],
        ]);

        TeamInvite::query()->create([
            'tenant_id' => $tenant->id,
            'invited_by' => $user->id,
            'phone_e164' => $data['phone_e164'],
            'role' => $data['role'],
            'token_hash' => hash('sha256', Str::random(40)),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        return back()->with('success', 'تم إنشاء الدعوة. يصل العضو عبر رمز OTP على رقمه.');
    }
}
