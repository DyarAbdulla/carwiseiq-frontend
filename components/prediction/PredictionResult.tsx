"use client"

import { lazy, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import type { PredictionResponse, CarFeatures } from '@/lib/types'

// Lazy load heavy components for code splitting
const DealAnalysis = lazy(() => import('./DealAnalysis').then(mod => ({ default: mod.DealAnalysis })))
const MarketComparison = lazy(() => import('./MarketComparison').then(mod => ({ default: mod.MarketComparison })))
const SimilarCars = lazy(() => import('./SimilarCars').then(mod => ({ default: mod.SimilarCars })))
const SmartTips = lazy(() => import('./SmartTips').then(mod => ({ default: mod.SmartTips })))
const WhyThisPrice = lazy(() => import('./WhyThisPrice').then(mod => ({ default: mod.WhyThisPrice })))
const ConfidenceMeter = lazy(() => import('./ConfidenceMeter').then(mod => ({ default: mod.ConfidenceMeter })))
const DealScoreBadge = lazy(() => import('./DealScoreBadge').then(mod => ({ default: mod.DealScoreBadge })))
const PriceHistoryChart = lazy(() => import('./PriceHistoryChart').then(mod => ({ default: mod.PriceHistoryChart })))
const MarketDemandIndicator = lazy(() => import('./MarketDemandIndicator').then(mod => ({ default: mod.MarketDemandIndicator })))
const AnimatedPriceReveal = lazy(() => import('./AnimatedPriceReveal').then(mod => ({ default: mod.AnimatedPriceReveal })))
const SaveToCompare = lazy(() => import('./SaveToCompare').then(mod => ({ default: mod.SaveToCompare })))
const ShareResults = lazy(() => import('./ShareResults').then(mod => ({ default: mod.ShareResults })))
const ExportButtons = lazy(() => import('./ExportButtons').then(mod => ({ default: mod.ExportButtons })))
const SavePrediction = lazy(() => import('./SavePrediction').then(mod => ({ default: mod.SavePrediction })))
const WhatIfScenarios = lazy(() => import('./WhatIfScenarios').then(mod => ({ default: mod.WhatIfScenarios })))
const FeedbackPrompt = lazy(() => import('./FeedbackPrompt').then(mod => ({ default: mod.FeedbackPrompt })))
const AIImprovementBanner = lazy(() => import('./AIImprovementBanner').then(mod => ({ default: mod.AIImprovementBanner })))

interface PredictionResultProps {
  result: PredictionResponse
  carFeatures: CarFeatures
  onUpdate?: (updates: Partial<CarFeatures>) => void
  predictionId?: number  // ID from backend after saving prediction
}

export function PredictionResult({ result, carFeatures, onUpdate, predictionId }: PredictionResultProps) {
  const t = useTranslations('predict.result')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      id="prediction-results"
    >
      {/* Main Price Display with Animation */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#2a2d3a] bg-gradient-to-br from-[#5B7FFF]/10 to-[#1a1d29]">
        <CardHeader>
          <CardDescription className="text-[#94a3b8] text-sm">{t('estimatedValue')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-16 w-full" />}>
            <AnimatedPriceReveal price={result.predicted_price} />
          </Suspense>
          {result.confidence_interval && (
            <div className="text-sm text-[#94a3b8] mt-4 mb-2">
              {t('confidence')}: {result.confidence_interval.lower.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} - {result.confidence_interval.upper.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </div>
          )}
          {result.confidence_range && (
            <div className="text-sm text-[#94a3b8] mb-2">
              Confidence Range: ±{result.confidence_range.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </div>
          )}
          {result.precision && (
            <div className="mt-2">
              <span className="text-sm text-[#94a3b8]">{t('precision')}: </span>
              <Badge variant={result.precision < 20 ? 'success' : result.precision < 40 ? 'warning' : 'destructive'}>
                ±{result.precision.toFixed(1)}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Deal Score Badge */}
      {result.deal_score && result.market_comparison && (
        <motion.div variants={itemVariants}>
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <DealScoreBadge
              dealScore={result.deal_score}
              marketAverage={result.market_comparison.market_average}
            />
          </Suspense>
        </motion.div>
      )}

      {/* Confidence Meter */}
      <motion.div variants={itemVariants}>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <ConfidenceMeter
            confidenceLevel={result.confidence_level}
            confidenceInterval={result.confidence_interval}
            precision={result.precision}
          />
        </Suspense>
      </motion.div>

      {/* Why This Price - Price Factors */}
      {result.price_factors && result.price_factors.length > 0 && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <WhyThisPrice factors={result.price_factors} />
        </Suspense>
      )}

      {/* Market Demand Indicator */}
      {result.market_demand && (
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <MarketDemandIndicator demand={result.market_demand} />
        </Suspense>
      )}

      {/* Deal Analysis */}
      {result.deal_analysis && result.market_comparison && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <DealAnalysis
            dealAnalysis={result.deal_analysis}
            marketComparison={result.market_comparison}
            predictedPrice={result.predicted_price}
          />
        </Suspense>
      )}

      {/* Market Comparison */}
      {result.market_comparison && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <MarketComparison
            marketComparison={result.market_comparison}
            precision={result.precision}
          />
        </Suspense>
      )}

      {/* Price History Chart */}
      {result.market_trends && result.market_trends.length > 0 && (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <PriceHistoryChart trends={result.market_trends} />
        </Suspense>
      )}

      {/* Similar Cars */}
      {result.similar_cars && result.similar_cars.length > 0 && (
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SimilarCars cars={result.similar_cars} />
        </Suspense>
      )}

      {/* Smart Tips */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <SmartTips />
      </Suspense>

      {/* What-If Scenarios */}
      <motion.div variants={itemVariants}>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <WhatIfScenarios
            initialFeatures={carFeatures}
            initialPrediction={result}
            onUpdate={onUpdate}
          />
        </Suspense>
      </motion.div>

      {/* AI Improvement Banner */}
      <motion.div variants={itemVariants}>
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <AIImprovementBanner />
        </Suspense>
      </motion.div>

      {/* Feedback Prompt */}
      {predictionId && (
        <motion.div variants={itemVariants}>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <FeedbackPrompt
              predictionId={predictionId}
              result={result}
              carFeatures={carFeatures}
            />
          </Suspense>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="space-y-3 pt-4 border-t border-[#2a2d3a]">
        {/* Save Prediction */}
        <Suspense fallback={<Skeleton className="h-12 w-full" />}>
          <SavePrediction result={result} carFeatures={carFeatures} />
        </Suspense>

        {/* Save to Compare */}
        <Suspense fallback={<Skeleton className="h-12 w-full" />}>
          <SaveToCompare carFeatures={carFeatures} result={result} />
        </Suspense>

        {/* Share and Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Suspense fallback={<Skeleton className="h-12 flex-1" />}>
            <ShareResults result={result} carFeatures={carFeatures} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-12 flex-1" />}>
            <ExportButtons result={result} carFeatures={carFeatures} />
          </Suspense>
        </div>
      </motion.div>
    </motion.div>
  )
}

