"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const RECOVERY_TYPES = ['recovery', 'reset_password']

function AuthCallbackContent() {
  const router = useRouter()
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (typeof window === 'undefined') return

      const locale = pathname.split('/')[1] || 'en'

      // PKCE: query has code (and optionally type)
      const code = searchParams?.get('code')
      const queryType = searchParams?.get('type')

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          const isRecovery = RECOVERY_TYPES.includes(queryType || '')
          router.replace(isRecovery ? `/${locale}/reset-password` : `/${locale}/dashboard`)
        } catch (e: any) {
          setError(e?.message || 'Authentication failed')
          setTimeout(() => router.replace(`/${locale}/login`), 3000)
        }
        return
      }

      // Implicit / hash: access_token, refresh_token, type
      const hash = window.location.hash
      if (!hash) {
        setError('No authentication data received. You may have already signed in.')
        setTimeout(() => router.replace(`/${locale}`), 3000)
        return
      }

      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')

      if (!access_token || !refresh_token) {
        setError('Invalid authentication data.')
        return
      }

      try {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (sessionError) throw sessionError

        const isRecovery = RECOVERY_TYPES.includes(type || '')
        if (isRecovery) {
          router.replace(`/${locale}/reset-password`)
        } else {
          router.replace(`/${locale}/dashboard`)
        }
      } catch (e: any) {
        setError(e?.message || 'Authentication failed')
        setTimeout(() => router.replace(`/${locale}/login`), 3000)
      }
    }

    run()
  }, [pathname, router, searchParams])

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 p-6 bg-[#0f1117]">
      {error ? (
        <>
          <p className="text-red-400 text-center">{error}</p>
          <p className="text-[#94a3b8] text-sm">Redirecting...</p>
        </>
      ) : (
        <>
          <Loader2 className="h-12 w-12 text-[#5B7FFF] animate-spin" />
          <p className="text-[#94a3b8]">Completing sign in...</p>
        </>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 p-6 bg-[#0f1117]">
        <Loader2 className="h-12 w-12 text-[#5B7FFF] animate-spin" />
        <p className="text-[#94a3b8]">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
