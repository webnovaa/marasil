import { describe, expect, it } from 'vitest';
import { dashboardLabel, hasPermission, homePath, type AuthUser } from '@/Lib/auth';

const adminUser: AuthUser = {
    id: '01',
    phone_e164: '+963900000000',
    status: 'active',
    full_name: 'Admin',
    roles: ['admin'],
    permissions: ['users.view', 'plans.manage'],
    can_access_admin: true,
    can_access_tenant: false,
    home_path: '/admin',
};

const tenantUser: AuthUser = {
    id: '02',
    phone_e164: '+963911111111',
    status: 'active',
    full_name: 'Tenant',
    roles: ['tenant_owner'],
    permissions: [],
    can_access_admin: false,
    can_access_tenant: true,
    home_path: '/devices',
};

describe('auth helpers', () => {
    it('returns role-aware dashboard labels', () => {
        expect(dashboardLabel(adminUser)).toBe('لوحة الإدارة');
        expect(dashboardLabel(tenantUser)).toBe('لوحة التحكم');
    });

    it('returns home paths from shared auth', () => {
        expect(homePath(adminUser)).toBe('/admin');
        expect(homePath(tenantUser)).toBe('/devices');
        expect(homePath(null)).toBe('/dashboard');
    });

    it('checks permissions from shared auth payload', () => {
        expect(hasPermission(adminUser, 'users.view')).toBe(true);
        expect(hasPermission(adminUser, 'users.approve')).toBe(false);
        expect(hasPermission(tenantUser, 'users.view')).toBe(false);
    });
});
