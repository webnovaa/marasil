export type AuthUser = {
    id: string | null;
    phone_e164: string | null;
    status: string | null;
    full_name: string | null;
    roles: string[];
    permissions: string[];
    can_access_admin: boolean;
    can_access_tenant: boolean;
    home_path: string;
};

export type SharedSubscription = {
    is_usable: boolean;
    has_pending_request: boolean;
    plan_name?: string | null;
    status?: string | null;
    ends_at?: string | null;
    max_devices?: number | null;
    monthly_message_limit?: number | null;
};

export type SharedAuth = {
    user: AuthUser | null;
};

export type SharedPageProps = {
    auth?: SharedAuth;
    subscription?: SharedSubscription | null;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
    return user?.permissions.includes(permission) ?? false;
}

export function hasAnyRole(user: AuthUser | null | undefined, ...roles: string[]): boolean {
    if (!user) {
        return false;
    }

    return roles.some((role) => user.roles.includes(role));
}

export function dashboardLabel(user: AuthUser | null | undefined): string {
    if (user?.can_access_admin) {
        return 'لوحة الإدارة';
    }

    return 'لوحة التحكم';
}

export function homePath(user: AuthUser | null | undefined): string {
    return user?.home_path ?? '/dashboard';
}
