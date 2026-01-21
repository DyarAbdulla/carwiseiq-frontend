'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, Fuel, DollarSign, Shield, ThumbsUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { sanitizeRichHtml } from '@/utils/sanitize'
import { motion } from 'framer-motion'

interface CarRec {
  name: string
  index: number
  price: number
  horsepower?: number
  fuelEconomy?: number
  savings?: number
  reliability?: number
}

interface SmartRecommendationsProps {
  cars: CarRec[]
  bestDealIndex: number
  savings: number[]
  /** Best for: performance (highest hp), economy (best mpg), value (best $/hp or lowest price), reliability */
  bestForPerformance?: number
  bestForEconomy?: number
  bestForValue?: number
  bestForReliability?: number
}

export function SmartRecommendations({
  cars,
  bestDealIndex,
  savings,
  bestForPerformance = 0,
  bestForEconomy = 0,
  bestForValue = bestDealIndex,
  bestForReliability = 0,
}: SmartRecommendationsProps) {
  const best = cars[bestDealIndex]
  const lines: { icon: React.ReactNode; text: string; carName?: string }[] = []

  if (best) {
    lines.push({
      icon: <DollarSign className="h-4 w-4 text-green-500" />,
      text: `Best value: **${best.name}** at ${formatCurrency(best.price)}.`,
      carName: best.name,
    })
    const save = savings[bestDealIndex] ?? 0
    if (save > 0) {
      lines.push({
        icon: <ThumbsUp className="h-4 w-4 text-[#5B7FFF]" />,
        text: `You save ${formatCurrency(save)} vs the most expensive option.`,
      })
    }
  }

  const perf = cars[bestForPerformance]
  if (perf && (perf.horsepower ?? 0) > 0 && bestForPerformance !== bestDealIndex) {
    lines.push({
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      text: `Best for performance: **${perf.name}** (${perf.horsepower} hp).`,
      carName: perf.name,
    })
  }

  const econ = cars[bestForEconomy]
  if (econ && (econ.fuelEconomy ?? 0) > 0 && bestForEconomy !== bestDealIndex) {
    lines.push({
      icon: <Fuel className="h-4 w-4 text-emerald-400" />,
      text: `Best for fuel economy: **${econ.name}** (${Number(econ.fuelEconomy).toFixed(1)} L/100km combined).`,
      carName: econ.name,
    })
  }

  const rel = cars[bestForReliability]
  if (rel && (rel.reliability ?? 0) >= 4.5 && bestForReliability !== bestDealIndex) {
    lines.push({
      icon: <Shield className="h-4 w-4 text-blue-400" />,
      text: `Best for reliability: **${rel.name}**.`,
      carName: rel.name,
    })
  }

  if (lines.length === 0) return null

  return (
    <Card className="border-[#5B7FFF]/40 bg-gradient-to-br from-[#5B7FFF]/10 to-[#1a1d29] overflow-visible">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#5B7FFF]" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {lines.map((l, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 text-[#94a3b8]"
            >
              <span className="mt-0.5 shrink-0">{l.icon}</span>
              <span
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(l.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')),
                }}
              />
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
