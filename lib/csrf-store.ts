/**
 * Client-side store for CSRF token. Used by API interceptors to add X-CSRF-Token header.
 * CsrfProvider fetches from GET /api/csrf-token and calls set(). Never import api.ts here
 * to avoid circular dependency.
 */
let token: string | null = null;

export const csrfStore = {
  get(): string | null {
    return token;
  },
  set(t: string | null) {
    token = t;
  },
};
