/**
 * Share utilities for compare page: build shareable URL, WhatsApp, Email, etc.
 */

export type CompareShareMode = 'marketplace' | 'prediction'

export interface PredictionCompareState {
  cars: Array<{ features?: unknown; prediction?: unknown }>
}

/** Build shareable URL for current comparison. */
export function getCompareShareUrl(opts: {
  mode: CompareShareMode
  /** For marketplace: listing IDs */
  ids?: number[]
  /** For prediction: full state (only if we support encoding; can be large) */
  predictionState?: PredictionCompareState | null
  baseUrl?: string
}): string {
  const { mode, ids, predictionState, baseUrl } = opts
  let base = baseUrl || ''
  if (typeof window !== 'undefined') {
    const u = new URL(window.location.href)
    u.search = ''
    base = u.toString().replace(/\/?$/, '')
  }

  if (mode === 'marketplace' && ids && ids.length > 0) {
    return `${base}?ids=${ids.join(',')}`
  }

  if (mode === 'prediction' && predictionState && predictionState.cars?.length > 0) {
    try {
      const json = JSON.stringify(predictionState)
      const b64 = typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : ''
      if (b64.length < 1800) return `${base}?type=pred&v=1&d=${encodeURIComponent(b64)}`
    } catch {
      // ignore
    }
  }

  return base || '/compare'
}

/** Parse compare URL search params into ids (marketplace) or prediction state. */
export function parseCompareUrl(searchParams: URLSearchParams | { get: (k: string) => string | null } | null):
  | { mode: 'marketplace'; ids: number[] }
  | { mode: 'prediction'; state: PredictionCompareState }
  | null {
  if (!searchParams) return null

  const ids = searchParams.get('ids')?.split(',').map(id => parseInt(id.trim(), 10)).filter(n => !isNaN(n))
  if (ids && ids.length > 0) return { mode: 'marketplace', ids }

  const type = searchParams.get('type')
  const d = searchParams.get('d')
  if (type === 'pred' && d) {
    try {
      const raw = typeof atob !== 'undefined' ? atob(d) : ''
      const str = decodeURIComponent(escape(raw))
      const state = JSON.parse(str) as PredictionCompareState
      if (state?.cars?.length) return { mode: 'prediction', state }
    } catch {
      // ignore
    }
  }
  return null
}

export function getWhatsAppShareUrl(fullUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(fullUrl)}`
}

export function getEmailShareUrl(opts: { subject: string; body: string }): string {
  return `mailto:?subject=${encodeURIComponent(opts.subject)}&body=${encodeURIComponent(opts.body)}`
}
