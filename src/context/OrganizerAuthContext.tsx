'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';

const TOKEN_KEY = 'citybuzz_organizer_token';
const EMAIL_KEY = 'citybuzz_organizer_email';

interface OrganizerAuthContextType {
  organizerEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const OrganizerAuthContext = createContext<OrganizerAuthContextType | undefined>(undefined);

export function OrganizerAuthProvider({ children }: { children: React.ReactNode }) {
  const [organizerEmail, setOrganizerEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedEmail = localStorage.getItem(EMAIL_KEY);
    if (storedToken && storedEmail && storedToken !== 'null') {
      setOrganizerEmail(storedEmail);
    }
    setIsLoading(false);
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    const res = await api.organizerVerifyToken(token);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(EMAIL_KEY, res.organizerEmail);
    setOrganizerEmail(res.organizerEmail);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setOrganizerEmail(null);
  }, []);

  return (
    <OrganizerAuthContext.Provider
      value={{
        organizerEmail,
        isAuthenticated: !!organizerEmail,
        isLoading,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </OrganizerAuthContext.Provider>
  );
}

export function useOrganizerAuth() {
  const ctx = useContext(OrganizerAuthContext);
  if (!ctx) throw new Error('useOrganizerAuth must be used inside OrganizerAuthProvider');
  return ctx;
}

