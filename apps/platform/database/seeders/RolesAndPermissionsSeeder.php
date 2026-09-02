<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Identity\Models\Permission;
use App\Domain\Identity\Models\Role;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'users.view' => 'عرض المستخدمين',
            'users.approve' => 'الموافقة على المستخدمين',
            'users.suspend' => 'تعليق المستخدمين',
            'plans.manage' => 'إدارة الخطط',
            'subscriptions.view' => 'عرض الاشتراكات',
            'subscriptions.approve' => 'الموافقة على الاشتراكات',
            'subscriptions.extend' => 'تمديد الاشتراكات',
            'subscriptions.suspend' => 'تعليق الاشتراكات',
            'devices.view' => 'عرض الأجهزة',
            'devices.suspend' => 'تعليق الأجهزة',
            'devices.diagnose' => 'تشخيص الأجهزة',
            'messages.view_metadata' => 'عرض بيانات الرسائل',
            'billing.manage' => 'إدارة الفوترة',
            'support.manage' => 'إدارة الدعم',
            'audit.view' => 'عرض التدقيق',
            'settings.manage' => 'إدارة الإعدادات',
            'tenant.devices.access' => 'إدارة أجهزة الحساب',
            'tenant.messages.access' => 'عرض رسائل الحساب',
            'tenant.messages.send' => 'إرسال الرسائل',
            'tenant.api_keys.access' => 'إدارة مفاتيح API',
            'tenant.webhooks.access' => 'إدارة Webhooks',
            'tenant.billing.access' => 'عرض الفوترة',
            'tenant.team.access' => 'إدارة الفريق',
            'tenant.settings.access' => 'إعدادات الحساب',
            'tenant.templates.access' => 'إدارة القوالب',
        ];

        foreach ($permissions as $name => $label) {
            Permission::query()->updateOrCreate(['name' => $name], ['label' => $label]);
        }

        $roles = [
            'super_admin' => 'مدير النظام',
            'admin' => 'مشرف',
            'support_agent' => 'وكيل دعم',
            'tenant_owner' => 'مالك الحساب',
            'tenant_member' => 'عضو',
        ];

        foreach ($roles as $name => $label) {
            Role::query()->updateOrCreate(['name' => $name], ['label' => $label]);
        }

        $all = Permission::query()->pluck('id');
        Role::query()->where('name', 'super_admin')->first()?->permissions()->sync($all);

        $adminPerms = Permission::query()
            ->whereIn('name', [
                'users.view', 'users.approve', 'users.suspend',
                'plans.manage', 'subscriptions.view', 'subscriptions.approve',
                'subscriptions.extend', 'subscriptions.suspend',
                'devices.view', 'devices.suspend', 'devices.diagnose',
                'messages.view_metadata', 'billing.manage', 'support.manage', 'audit.view', 'settings.manage',
            ])
            ->pluck('id');
        Role::query()->where('name', 'admin')->first()?->permissions()->sync($adminPerms);

        $supportPerms = Permission::query()
            ->whereIn('name', [
                'users.view', 'subscriptions.view', 'devices.view',
                'devices.diagnose', 'messages.view_metadata', 'support.manage',
            ])
            ->pluck('id');
        Role::query()->where('name', 'support_agent')->first()?->permissions()->sync($supportPerms);

        $tenantOwnerPerms = Permission::query()
            ->where('name', 'like', 'tenant.%')
            ->pluck('id');
        Role::query()->where('name', 'tenant_owner')->first()?->permissions()->sync($tenantOwnerPerms);

        $tenantMemberPerms = Permission::query()
            ->whereIn('name', [
                'tenant.devices.access',
                'tenant.messages.access',
                'tenant.messages.send',
                'tenant.webhooks.access',
            ])
            ->pluck('id');
        Role::query()->where('name', 'tenant_member')->first()?->permissions()->sync($tenantMemberPerms);
    }
}
