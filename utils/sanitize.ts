/**
 * XSS sanitization using DOMPurify. Use for any user-generated or API-sourced HTML
 * before rendering with dangerouslySetInnerHTML. For plain text, use sanitizeText.
 * DOMPurify is only loaded in the browser; on server we strip all tags.
 */
function getDOMPurify(): { sanitize: (d: string, o?: object) => string } | null {
  if (typeof window === 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require('dompurify') as { default?: { sanitize: (d: string, o?: object) => string } })?.default ?? null;
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML for safe injection. Allows a minimal set of tags by default.
 * On server (no window/DOMPurify), strips all HTML tags.
 */
export function sanitizeHtml(
  dirty: string,
  opts?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[] }
): string {
  if (dirty == null || typeof dirty !== 'string') return '';
  const def = { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'p', 'span'], ALLOWED_ATTR: ['class'] };
  const o = { ...def, ...opts };
  const D = getDOMPurify();
  if (D?.sanitize) {
    try {
      return D.sanitize(dirty, o);
    } catch {
      return stripAllTags(dirty);
    }
  }
  return stripAllTags(dirty);
}

/** Strip all HTML tags. Safe fallback when DOMPurify is not available (e.g. SSR). */
function stripAllTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize plain text: escape < > & " ' for safe text display. Use when you must
 * display user/API text as text (no HTML).
 */
export function sanitizeText(t: string, maxLength?: number): string {
  if (t == null || typeof t !== 'string') return '';
  let s = t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  if (typeof maxLength === 'number' && maxLength > 0 && s.length > maxLength) {
    s = s.slice(0, maxLength) + '…';
  }
  return s;
}

/**
 * For rich text (e.g. markdown-like **bold** converted to <strong>): sanitize after
 * the conversion so only allowed tags remain. Prefer sanitizeHtml after your conversion.
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'span'], ALLOWED_ATTR: ['class'] });
}
