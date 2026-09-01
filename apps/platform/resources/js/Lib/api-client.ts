import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { router } from '@inertiajs/react';

type ApiSuccess<T> = {
    success: true;
    data: T;
    meta: { request_id: string } & Record<string, unknown>;
};

type ApiFailure = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: { request_id: string } & Record<string, unknown>;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

function csrfToken(): string | undefined {
    return document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') ?? undefined;
}

function createClient(baseURL: string): AxiosInstance {
    const client = axios.create({
        baseURL,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        withCredentials: true,
    });

    client.interceptors.request.use((config) => {
        const token = csrfToken();
        if (token) {
            config.headers.set('X-CSRF-TOKEN', token);
        }
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            const code = error.response?.data?.error?.code as string | undefined;

            if (code === 'SUBSCRIPTION_REQUIRED' || code === 'SUBSCRIPTION_EXPIRED') {
                router.visit('/plans');
            }

            return Promise.reject(error);
        },
    );

    return client;
}

const client = createClient('/api/v1');
const adminClient = createClient('/api/admin/v1');

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
    const { data } = await client.get<ApiEnvelope<T>>(url, config);
    return data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
    const { data } = await client.post<ApiEnvelope<T>>(url, body, config);
    return data;
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<ApiEnvelope<T>> {
    const { data } = await client.post<ApiEnvelope<T>>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
    const { data } = await client.patch<ApiEnvelope<T>>(url, body, config);
    return data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
    const { data } = await client.delete<ApiEnvelope<T>>(url, config);
    return data;
}

export async function adminPost<T>(url: string, body?: unknown): Promise<ApiEnvelope<T>> {
    const { data } = await adminClient.post<ApiEnvelope<T>>(url, body);
    return data;
}

export async function adminPatch<T>(url: string, body?: unknown): Promise<ApiEnvelope<T>> {
    const { data } = await adminClient.patch<ApiEnvelope<T>>(url, body);
    return data;
}

export async function adminDelete<T>(url: string): Promise<ApiEnvelope<T>> {
    const { data } = await adminClient.delete<ApiEnvelope<T>>(url);
    return data;
}

export { adminClient };
export default client;
