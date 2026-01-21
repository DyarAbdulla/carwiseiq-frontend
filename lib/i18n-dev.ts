/**
 * In development, logs when t(key) returns the key itself (missing translation).
 * Use: tKey(t, 'nav.foo') instead of t('nav.foo') in UI.
 */
export function tKey(t: (k: string) => string, key: string): string {
  return t(key)
}
