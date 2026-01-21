"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { SellDraftProvider } from '@/context/SellDraftContext'
import { useAuth } from '@/hooks/use-auth'

const STEPS = 6

function SellLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const locale = useLocale() || 'en'
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const returnUrl = `/${locale}/sell`
      router.replace(`/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [user, loading, router, locale])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }
  if (!user) {
    return null
  }

  const stepMatch = pathname.match(/\/sell\/step(\d+)/)
  const current = stepMatch ? Math.min(Math.max(1, parseInt(stepMatch[1], 10)), STEPS) : 1
  const showProgress = pathname.includes('/sell/step') && !pathname.includes('/sell/success')

  return (
    <>
      {/* Progress dots: 1 → 2 → 3 → 4 → 5 → 6 (hidden on success) */}
      {showProgress && (
      <div className="sticky top-16 z-30 flex justify-center gap-1.5 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={STEPS} aria-label={`Step ${current} of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full min-w-[8px] transition-all ${i + 1 <= current ? 'bg-indigo-500 w-5' : 'bg-white/20 w-2'}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
      )}
      <div className="form-wizard-container">
        {children}
      </div>
    </>
  )
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellDraftProvider>
      <SellLayoutInner>{children}</SellLayoutInner>
    </SellDraftProvider>
  )
}
