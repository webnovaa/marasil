import AsyncStorage from '@react-native-async-storage/async-storage';
import { Brand } from '@/constants/theme';

const STORAGE_KEYS = {
  TOKEN: '@marasil_auth_token',
  API_URL: '@marasil_api_url',
  USER: '@marasil_user_data',
};

export type DeviceStatus = 'connected' | 'disconnected' | 'pairing' | 'error' | string;

export interface DeviceItem {
  id: string;
  name: string;
  phone_e164: string | null;
  provider?: string;
  status: DeviceStatus;
  worker_id?: string;
  last_connected_at: string | null;
  last_disconnected_at: string | null;
  disconnect_reason?: string | null;
  api_key_prefix?: string | null;
  created_at: string | null;
}

export interface SubscriptionData {
  id: string;
  status: string;
  is_usable: boolean;
  starts_at: string | null;
  ends_at: string | null;
  grace_ends_at: string | null;
  plan_name: string;
  plan_slug: string;
  price_minor: number;
  currency: string;
  duration_days: number;
  max_devices: number;
  monthly_message_limit: number;
  daily_message_limit_per_device: number;
  features: string[];
}

export interface UserProfile {
  id: string;
  phone_e164: string;
  full_name?: string | null;
  company_name?: string | null;
  status: string;
  roles: string[];
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
}

class ApiService {
  private token: string | null = null;
  private apiUrl: string = Brand.defaultApiUrl;

  async init(): Promise<{ token: string | null; apiUrl: string; user: UserProfile | null }> {
    try {
      this.apiUrl = Brand.defaultApiUrl;
      await AsyncStorage.setItem(STORAGE_KEYS.API_URL, this.apiUrl);

      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (storedToken) this.token = storedToken;

      const user = storedUser ? (JSON.parse(storedUser) as UserProfile) : null;
      return { token: this.token, apiUrl: this.apiUrl, user };
    } catch {
      this.apiUrl = Brand.defaultApiUrl;
      return { token: null, apiUrl: this.apiUrl, user: null };
    }
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  async setApiUrl(url: string): Promise<void> {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.apiUrl = cleanUrl;
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, cleanUrl);
  }

  getToken(): string | null {
    return this.token;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  async setStoredUser(user: UserProfile | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
    const url = `${this.apiUrl}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          json.message ||
          json.error ||
          (json.errors ? Object.values(json.errors).flat().join(', ') : 'حدث خطأ في الخادم');
        return {
          success: false,
          error: errorMsg,
          message: errorMsg,
        };
      }

      return {
        success: true,
        data: (json.data ?? json) as T,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر الاتصال بالسيرفر';
      return {
        success: false,
        error: message,
        message: 'تعذر الاتصال بخادم المنصة. تحقق من اتصال الإنترنت.',
      };
    }
  }

  // --- Auth APIs ---
  async login(
    phoneE164: string,
    password: string,
  ): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    this.apiUrl = Brand.defaultApiUrl;

    const res = await this.request<{
      token: string;
      token_type: string;
      user: UserProfile;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone_e164: phoneE164.trim(),
        password,
        device_name: 'Marasil Mobile App',
      }),
    });

    if (res.success && res.data?.token) {
      await this.setToken(res.data.token);
      await this.setStoredUser(res.data.user);
      return {
        success: true,
        user: res.data.user,
        token: res.data.token,
      };
    }

    return {
      success: false,
      error: res.error || res.message || 'بيانات الدخول غير صحيحة.',
    };
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await this.setToken(null);
    }
  }

  async getMe(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const res = await this.request<UserProfile>('/me');
    if (res.success && res.data) {
      await this.setStoredUser(res.data);
      return { success: true, user: res.data };
    }
    return { success: false, error: res.error };
  }

  // --- Subscription APIs ---
  async getSubscription(): Promise<{
    success: boolean;
    subscription?: SubscriptionData | null;
    error?: string;
  }> {
    const res = await this.request<{ subscription: SubscriptionData | null }>('/subscription');
    if (res.success && res.data) {
      return { success: true, subscription: res.data.subscription };
    }
    return { success: false, error: res.error };
  }

  // --- Devices APIs ---
  async getDevices(): Promise<{ success: boolean; devices?: DeviceItem[]; error?: string }> {
    const res = await this.request<{ devices: DeviceItem[] }>('/devices');
    if (res.success && res.data) {
      return { success: true, devices: res.data.devices };
    }
    return { success: false, error: res.error };
  }

  async createDevice(
    name: string
  ): Promise<{ success: boolean; device?: DeviceItem; error?: string }> {
    const res = await this.request<{ device: DeviceItem }>('/devices', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.success && res.data) {
      return { success: true, device: res.data.device };
    }
    return { success: false, error: res.error };
  }

  async deleteDevice(deviceUlid: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.request(`/devices/${deviceUlid}`, {
      method: 'DELETE',
    });
    return { success: res.success, error: res.error };
  }

  async disconnectDevice(deviceUlid: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.request(`/devices/${deviceUlid}/disconnect`, {
      method: 'POST',
    });
    return { success: res.success, error: res.error };
  }

  async sendQuickMessage(
    deviceUlid: string,
    recipient: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        device: deviceUlid,
        to: recipient,
        message: message,
      }),
    });
    return { success: res.success, error: res.error };
  }

  async checkNumber(
    deviceUlid: string,
    phoneNumber: string
  ): Promise<{ success: boolean; exists?: boolean; error?: string }> {
    const res = await this.request<{ exists: boolean }>(`/devices/${deviceUlid}/check-number`, {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
      }),
    });
    if (res.success && res.data) {
      return { success: true, exists: res.data.exists };
    }
    return { success: false, error: res.error };
  }
}

export const api = new ApiService();
