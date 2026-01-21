"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import type { MarketComparison } from '@/lib/types'

interface DealAnalysisProps {
  dealAnalysis: 'excellent' | 'good' | 'fair' | 'poor'
  marketComparison: MarketComparison
  predictedPrice: number
}

export function DealAnalysis({ dealAnalysis, marketComparison, predictedPrice }: DealAnalysisProps) {
  const t = useTranslations('predict.result')
  const dealColors = {
    excellent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30',
    good: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-400/30',
    fair: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/30',
    poor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-400/30',
  }

  const dealLabels = {
    excellent: 'Excellent Deal',
    good: 'Good Deal',
    fair: 'Fair Price',
    poor: 'Poor Deal',
  }

  const isAboveAverage = marketComparison.percentage_difference > 0
  const percentageText = `${isAboveAverage ? '+' : ''}${marketComparison.percentage_difference.toFixed(1)}%`
  
  // Calculate market position (0-100%)
  const marketRange = marketComparison.market_average * 0.4 // ±20% range
  const minPrice = marketComparison.market_average - marketRange
  const maxPrice = marketComparison.market_average + marketRange
  const position = Math.max(0, Math.min(100, ((predictedPrice - minPrice) / (maxPrice - minPrice)) * 100))

  return (
    <Card className="border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          📊 {t('dealAnalysis')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className={cn(dealColors[dealAnalysis], 'border')}>
            {dealLabels[dealAnalysis]}
          </Badge>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {percentageText} vs market average
          </p>
        </div>

        {/* Market Position Bar */}
        <div className="relative h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-white/10 overflow-hidden">
          {/* LOW marker */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">LOW</div>
          {/* HIGH marker */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">HIGH</div>
          {/* MARKET POSITION marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">MARKET</div>
          
          {/* Soft amber bar showing position */}
          <div 
            className="absolute h-full bg-amber-400/70 dark:bg-amber-500/60 rounded-l transition-all duration-500"
            style={{ width: `${position}%` }}
          />
        </div>

        {/* Price range text */}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Your Car: {formatCurrency(predictedPrice)} · Market Range: {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
        </p>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This price is {dealAnalysis} and competitive. It&apos;s {percentageText} vs the market average for similar cars ({formatCurrency(marketComparison.market_average)}).
        </p>
      </CardContent>
    </Card>
  )
}

