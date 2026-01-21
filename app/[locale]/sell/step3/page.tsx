"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'

export default function SellStep3Page() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    // Step 3 is now just a fallback/loading screen
    // If detection already completed in Step 2, redirect immediately
    const detection = sessionStorage.getItem('sell_detection')
    const prefill = sessionStorage.getItem('sell_prefill')
    
    if (detection || prefill) {
      // Detection already done, go to step 4
      router.push(`/${locale}/sell/step4`)
    } else {
      // No detection yet, wait a moment then redirect (detection should happen in Step 2)
      const timer = setTimeout(() => {
        router.push(`/${locale}/sell/step4`)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [router, locale])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <Card className="bg-gray-800 border-gray-700 max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Sparkles className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />
            <h2 className="text-xl font-bold text-white">Processing...</h2>
            <p className="text-gray-400">Preparing your listing</p>
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
