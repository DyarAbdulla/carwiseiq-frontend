import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced function with a cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/** L/100km = 235.215 / MPG. Rounded to 1 decimal. */
export function mpgToL100km(mpg: number): number {
  if (mpg == null || mpg <= 0) return 0
  return Math.round((235.215 / mpg) * 10) / 10
}

/** Format city/highway MPG as "X / Y L/100km". Converts via mpgToL100km. */
export function formatFuelEconomyL100km(city: number, highway: number): string {
  if (city == null || highway == null || city <= 0 || highway <= 0) return '—'
  const c = mpgToL100km(city)
  const h = mpgToL100km(highway)
  return `${c} / ${h} L/100km`
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi']

/**
 * Detect if a URL points to a video file by extension or path.
 */
export function isVideoFile(url: string | null | undefined): boolean {
  if (url == null || typeof url !== 'string' || !url) return false
  const path = url.split('?')[0] || ''
  const lower = path.toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}/**
 * Format phone for display (e.g. +964 777 447 2106 or 0777 447 2106).
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (phone == null || typeof phone !== 'string' || !phone.trim()) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('964') && cleaned.length >= 10) {
    return `+964 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith('0') && cleaned.length >= 10) {
    return `0${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Build tel: link from listing phone_country_code and phone.
 */
export function getContactTel(listing: { phone?: string | null; phone_country_code?: string | null }): string {
  const cc = (listing?.phone_country_code || '').trim()
  const p = (listing?.phone || '').replace(/\D/g, '')
  if (!p) return ''
  const pre = cc ? (cc.startsWith('+') ? cc : '+' + cc) : ''
  return `tel:${pre}${p}`
}

/**
 * Resolve listing image src: full URLs as-is; /uploads/... prefixed with API base.
 */
export function listingImageUrl(
  src: string | null | undefined,
  apiBase?: string
): string {
  if (src == null || typeof src !== 'string' || !src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const base = (apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')
  return base ? base + (src.startsWith('/') ? src : '/' + src) : src
}
