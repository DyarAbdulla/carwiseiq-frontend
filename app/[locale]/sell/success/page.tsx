"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Share2, Eye, Plus } from 'lucide-react'

function SellSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const listingId = searchParams?.get('id')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/20 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎉 Your car is now live!</h1>
              <p className="text-gray-400">
                Your listing has been published and is now visible to buyers.
              </p>
            </div>

            {listingId && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300 text-sm mb-2">Listing URL:</p>
                <p className="text-blue-400 font-mono text-xs break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/{locale}/buy-sell/{listingId}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push(`/${locale}/buy-sell/${listingId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                View my listing
              </Button>
              <Button
                onClick={() => router.push(`/${locale}/buy-sell`)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
              >
                Go to marketplace
              </Button>
              <Button
                onClick={() => router.push(`/${locale}/sell/step1`)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post another car
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SellSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SellSuccessPageContent />
    </Suspense>
  )
}
