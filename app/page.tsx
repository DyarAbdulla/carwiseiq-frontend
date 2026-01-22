export const runtime = 'edge';
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { defaultLocale } from '@/i18n'

// Root page redirects to default locale
// Client-side redirect works on Cloudflare Pages static deployment
// _redirects file in public/ also handles this at the edge level
export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(`/${defaultLocale}`)
  }, [router])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting...</p>
    </div>
  )
}
