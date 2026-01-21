"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const RECOVERY_TYPES = ['recovery', 'reset_password']

/**
 * If the recovery link lands on / or /[locale] (Site URL) with hash tokens,
 * redirect to /[locale]/auth/callback so the callback can setSession and
 * send the user to /[locale]/reset-password. Prevents recovery from ending
 * on home with no reset form.
 */
export function RecoveryHashRedirect() {
  const pathname = usePathname() || ''

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname.includes('/auth/callback')) return

    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const type = params.get('type')
    if (!access_token || !refresh_token || !RECOVERY_TYPES.includes(type || '')) return

    const locale = pathname.split('/')[1] || 'en'
    window.location.replace(`${window.location.origin}/${locale}/auth/callback${hash}`)
  }, [pathname])

  return null
}
