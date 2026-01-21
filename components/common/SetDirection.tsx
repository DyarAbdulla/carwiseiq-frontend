"use client"

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

/** Arabic and Kurdish use RTL. English uses LTR. */
const RTL_LOCALES = ['ar', 'ku']

/**
 * Sets document.documentElement.dir (rtl for ar/ku, ltr for en) and lang to the current locale.
 */
export function SetDirection() {
  const locale = useLocale() || 'en'

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'
    root.setAttribute('dir', dir)
    root.setAttribute('lang', locale)
  }, [locale])

  return null
}
