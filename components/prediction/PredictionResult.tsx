"use client"

import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Settings2, MapPin } from 'lucide-react'
import type { PredictionResponse, CarFeatures } from '@/lib/types'
import { ValuationCertificate } from './ValuationCertificate'
import { ShareExportMenu } from './ShareExportMenu'
import { InsightsTabs } from './InsightsTabs'

const FeedbackPrompt = lazy(() => import('./FeedbackPrompt').then(mod => ({ default: mod.FeedbackPrompt })))

interface PredictionResultProps {
  result: PredictionResponse
  carFeatures: CarFeatures
  onUpdate?: (updates: Partial<CarFeatures>) => void
  predictionId?: number
  carPreviewElement?: React.ReactNode
}

export function PredictionResult({ result, carFeatures, onUpdate, predictionId, carPreviewElement }: PredictionResultProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  }

  const techSpecs = [
    { label: 'Year', value: carFeatures.year },
    { label: 'Make', value: carFeatures.make },
    { label: 'Model', value: carFeatures.model },
    { label: 'Mileage', value: carFeatures.mileage != null ? `${Number(carFeatures.mileage).toLocaleString()} km` : '—' },
    { label: 'Engine', value: carFeatures.engine_size != null ? `${carFeatures.engine_size} L` : '—' },
    { label: 'Cylinders', value: carFeatures.cylinders ?? '—' },
    { label: 'Condition', value: carFeatures.condition || '—' },
    { label: 'Fuel', value: carFeatures.fuel_type || '—' },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
      id="prediction-results"
    >
      {/* Left: Certificate + Tabs — 8 cols on desktop */}
      <div className="lg:col-span-8 space-y-4">
        {carPreviewElement}

        {/* Valuation Certificate — main card */}
        <motion.div variants={itemVariants}>
          <ValuationCertificate result={result} />
        </motion.div>

        {/* Actions: Save + Share/Export — near certificate */}
        <motion.div variants={itemVariants}>
          <ShareExportMenu result={result} carFeatures={carFeatures} />
        </motion.div>

        {/* Insights Tabs: Overview, Similar Cars, History, What-If, Export */}
        <motion.div variants={itemVariants}>
          <InsightsTabs result={result} carFeatures={carFeatures} onUpdate={onUpdate} />
        </motion.div>

        {predictionId && (
          <motion.div variants={itemVariants}>
            <Suspense fallback={null}>
              <FeedbackPrompt predictionId={predictionId} result={result} carFeatures={carFeatures} />
            </Suspense>
          </motion.div>
        )}
      </div>

      {/* Right: Technical Specs + Regional Info — 4 cols on desktop */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div variants={itemVariants}>
          <Card className="hover-lift border-[#2a2d3a] bg-[#1a1d29]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <Settings2 className="h-4 w-4" />
                Technical Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="space-y-2 text-sm">
                {techSpecs.map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100 truncate">{String(value ?? '—')}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover-lift border-[#2a2d3a] bg-[#1a1d29]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4" />
                Regional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Location</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{carFeatures.location || '—'}</span>
              </div>
              {result.market_comparison && (
                <div className="text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-white/10">
                  Market avg: {result.market_comparison.market_average.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </div>
              )}
              {result.market_demand && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Demand: {result.market_demand.level || '—'}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
