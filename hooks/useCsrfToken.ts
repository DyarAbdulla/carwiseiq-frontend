/**
 * Hook to access CSRF token and refresh from CsrfContext.
 * Use when you need the token in a form (e.g. hidden input) or to trigger refresh.
 */
'use client';

import { useContext } from 'react';
import { CsrfContext } from '@/context/CsrfContext';

export function useCsrfToken() {
  const ctx = useContext(CsrfContext);
  return {
    csrfToken: ctx?.csrfToken ?? null,
    refresh: ctx?.refresh ?? (() => Promise.resolve()),
    loading: ctx?.loading ?? false,
  };
}
