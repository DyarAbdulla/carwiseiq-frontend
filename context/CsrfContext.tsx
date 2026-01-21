'use client';

/**
 * CsrfProvider: fetches CSRF token from backend on mount and stores in csrfStore
 * so API interceptors can add X-CSRF-Token to POST/PUT/PATCH/DELETE.
 * Also provides the token to children (e.g. forms with hidden input).
 */
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { csrfStore } from '@/lib/csrf-store';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000')
  : '';

type CsrfContextValue = {
  csrfToken: string | null;
  refresh: () => Promise<void>;
  loading: boolean;
};

export const CsrfContext = createContext<CsrfContextValue | null>(null);

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || !API_BASE) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/csrf-token`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      const t = (data?.csrf_token ?? '').trim() || null;
      csrfStore.set(t);
      setCsrfToken(t);
    } catch {
      csrfStore.set(null);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: CsrfContextValue = { csrfToken, refresh, loading };

  return (
    <CsrfContext.Provider value={value}>
      {children}
    </CsrfContext.Provider>
  );
}
