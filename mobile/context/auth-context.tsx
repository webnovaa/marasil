import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type UserProfile } from '@/services/api';
import { Brand } from '@/constants/theme';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  apiUrl: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiUrl] = useState<string>(Brand.defaultApiUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        await api.init();
        const currentToken = api.getToken();
        setToken(currentToken);

        if (currentToken) {
          const profile = await api.getMe();
          if (profile.success && profile.user) {
            setUser(profile.user);
          } else {
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

  async function login(phone: string, pass: string) {
    setIsLoading(true);
    try {
      const res = await api.login(phone, pass);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
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
