import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type UserProfile } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  apiUrl: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, pass: string, customUrl?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateApiUrl: (url: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiUrl, setApiUrlState] = useState<string>(api.getApiUrl());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const init = await api.init();
        setToken(init.token);
        setApiUrlState(init.apiUrl);
        if (init.user) setUser(init.user);

        if (init.token) {
          const profile = await api.getMe();
          if (profile.success && profile.user) {
            setUser(profile.user);
          } else {
            // Token expired or invalid
            await api.setToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuth();
  }, []);

  async function login(phone: string, pass: string, customUrl?: string) {
    setIsLoading(true);
    try {
      const res = await api.login(phone, pass, customUrl);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setApiUrlState(api.getApiUrl());
        return { success: true };
      }
      return { success: false, error: res.error };
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateApiUrl(url: string) {
    await api.setApiUrl(url);
    setApiUrlState(api.getApiUrl());
  }

  async function refreshProfile() {
    if (!token) return;
    const res = await api.getMe();
    if (res.success && res.user) {
      setUser(res.user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        apiUrl,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        updateApiUrl,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
