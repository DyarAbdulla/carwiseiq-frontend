"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { PredictionResponse, CarFeatures } from '@/lib/types'
import { SimilarCarsPreview } from './SimilarCarsPreview'
import { PriceHistoryChart } from './PriceHistoryChart'
import { WhatIfScenarios } from './WhatIfScenarios'
import { ShareResults } from './ShareResults'
import { ExportButtons } from './ExportButtons'
import { cn } from '@/lib/utils'

interface InsightsTabsProps {
  result: PredictionResponse
  carFeatures: CarFeatures
  onUpdate?: (updates: Partial<CarFeatures>) => void
}

const dealColors: Record<string, string> = {
  excellent: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
  good: 'bg-sky-500/15 text-sky-400 border-sky-400/30',
  fair: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  poor: 'bg-rose-500/15 text-rose-400 border-rose-400/30',
}

function OverviewContent({ result }: { result: PredictionResponse }) {
  const mc = result.market_comparison
  const deal = result.deal_analysis || result.deal_score?.score || 'fair'
  const isAbove = mc ? mc.percentage_difference > 0 : false

  return (
    <div className="space-y-4">
      {result.deal_score && mc && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl" aria-hidden>{result.deal_score.badge}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2.5 py-0.5 text-sm font-medium', dealColors[deal] || dealColors.fair)}>
              {result.deal_score.label}
            </span>
            <span className="text-sm text-[#94a3b8]">
              Market avg {formatCurrency(mc.market_average)} · {isAbove ? '+' : ''}{mc.percentage_difference.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
      {mc && !result.deal_score && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-[#94a3b8]">Your car:</span>
          <span className="font-medium text-white">{formatCurrency(mc.your_car)}</span>
          <span className="text-[#94a3b8]">· Market avg:</span>
          <span className="text-white">{formatCurrency(mc.market_average)}</span>
          <span className={isAbove ? 'text-amber-400' : 'text-emerald-400'}>
            ({isAbove ? '+' : ''}{mc.percentage_difference.toFixed(1)}%)
          </span>
        </div>
      )}
      {result.precision != null && result.precision > 30 && (
        <p className="text-xs text-[#94a3b8]">
          Wider confidence range: less historical data for this make/model. Use as a guide.
        </p>
      )}
      {!mc && !result.deal_score && (
        <p className="text-sm text-[#94a3b8]">Market comparison not available for this prediction.</p>
      )}
    </div>
  )
}

export function InsightsTabs({ result, carFeatures, onUpdate }: InsightsTabsProps) {
  const trends = result.market_trends || []
  const similar = result.similar_cars || []

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full flex flex-nowrap overflow-x-auto">
        <TabsTrigger value="overview" className="shrink-0">Overview</TabsTrigger>
        <TabsTrigger value="similar" className="shrink-0">Similar Cars</TabsTrigger>
        <TabsTrigger value="history" className="shrink-0">History</TabsTrigger>
        <TabsTrigger value="whatif" className="shrink-0">What-If</TabsTrigger>
        <TabsTrigger value="export" className="shrink-0">Export</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewContent result={result} />
      </TabsContent>
      <TabsContent value="similar">
        <SimilarCarsPreview cars={similar} />
      </TabsContent>
      <TabsContent value="history">
        {trends.length === 0 ? (
          <p className="text-sm text-[#94a3b8] py-4">No price history available.</p>
        ) : (
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <PriceHistoryChart trends={trends} compact />
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="whatif">
        <WhatIfScenarios initialFeatures={carFeatures} initialPrediction={result} onUpdate={onUpdate} />
      </TabsContent>
      <TabsContent value="export">
        <div className="flex flex-wrap gap-3">
          <ShareResults result={result} carFeatures={carFeatures} />
          <ExportButtons result={result} carFeatures={carFeatures} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
