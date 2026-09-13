'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '@/types/api';
import { api } from '@/lib/api-client';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('city_discovery_admin_token');
      const storedUser = localStorage.getItem('city_discovery_admin_user');
      // Guard against 'null' / 'undefined' strings left by previous bugs
      if (
        storedToken &&
        storedToken !== 'null' &&
        storedToken !== 'undefined' &&
        storedUser &&
        storedUser !== 'null' &&
        storedUser !== 'undefined'
      ) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedUser));
      } else {
        // Clean up stale / corrupt entries
        localStorage.removeItem('city_discovery_admin_token');
        localStorage.removeItem('city_discovery_admin_user');
      }
    } catch (e) {
      console.error('Failed to parse stored auth session:', e);
      localStorage.removeItem('city_discovery_admin_token');
      localStorage.removeItem('city_discovery_admin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.adminLogin(email, password);
    setToken(res.token);
    setAdmin(res.user);
    localStorage.setItem('city_discovery_admin_token', res.token);
    localStorage.setItem('city_discovery_admin_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('city_discovery_admin_token');
    localStorage.removeItem('city_discovery_admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
