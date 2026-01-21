'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Zap, TrendingDown, Gauge } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { valueMetrics } from '@/lib/carSpecifications'
import { motion } from 'framer-motion'

interface CarValue {
  name: string
  price: number
  horsepower: number
  mileage: number
}

interface ValueAnalysisSectionProps {
  cars: CarValue[]
  bestDealIndex?: number
}

export function ValueAnalysisSection({ cars, bestDealIndex = 0 }: ValueAnalysisSectionProps) {
  const withMetrics = cars.map(c => ({ ...c, ...valueMetrics(c.price, c.horsepower || 1, c.mileage || 1) }))
  const bestPricePerHp = Math.min(...withMetrics.map(c => c.pricePerHp).filter(Boolean)) || 0
  const bestPricePer10k = Math.min(...withMetrics.map(c => c.pricePer10kMiles).filter(Boolean)) || 0

  return (
    <Card className="border-[#2a2d3a] bg-gradient-to-br from-[#1a1d29] to-[#0f1117] overflow-visible">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[#5B7FFF]" />
          Value Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withMetrics.map((c, i) => {
            const isBest = i === bestDealIndex
            const bestPh = c.pricePerHp > 0 && c.pricePerHp <= bestPricePerHp * 1.05
            const bestPm = c.pricePer10kMiles > 0 && c.pricePer10kMiles <= bestPricePer10k * 1.05
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl border p-4 ${
                  isBest ? 'border-green-500/50 bg-green-500/5' : 'border-[#2a2d3a] bg-[#0f1117]/50'
                }`}
              >
                <div className="font-semibold text-white truncate mb-3">{c.name}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Price / HP</span>
                    <span className={bestPh ? 'text-green-400 font-medium' : 'text-white'}>
                      {c.pricePerHp ? formatCurrency(c.pricePerHp) : '—'}
                      {bestPh && ' ✓'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Price / 10k mi</span>
                    <span className={bestPm ? 'text-green-400 font-medium' : 'text-white'}>
                      {c.pricePer10kMiles ? formatCurrency(c.pricePer10kMiles) : '—'}
                      {bestPm && ' ✓'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
