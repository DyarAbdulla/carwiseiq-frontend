'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Crown, Trophy, TrendingDown, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SummaryCar {
  name: string
  price: number
  index: number
}

interface CompareSummaryCardsProps {
  cars: SummaryCar[]
  bestDealIndex: number
  mostExpensiveIndex: number
  savings: number[]
  onSelectCar?: (index: number) => void
}

export function CompareSummaryCards({
  cars,
  bestDealIndex,
  mostExpensiveIndex,
  savings,
  onSelectCar,
}: CompareSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cars.map((c, i) => {
        const isBest = i === bestDealIndex
        const isWorst = i === mostExpensiveIndex
        const save = savings[i] ?? 0
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectCar?.(i)}
            className={onSelectCar ? 'cursor-pointer' : ''}
          >
            <Card
              className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${
                isBest
                  ? 'border-green-500/70 bg-gradient-to-br from-green-500/10 to-[#1a1d29] shadow-green-500/10'
                  : isWorst
                  ? 'border-red-500/50 bg-gradient-to-br from-red-500/5 to-[#1a1d29]'
                  : 'border-[#2a2d3a] bg-[#1a1d29]/90 hover:border-[#5B7FFF]/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isBest && <Crown className="h-5 w-5 text-amber-400 shrink-0" />}
                      <span className="font-semibold text-white truncate">{c.name}</span>
                    </div>
                    <div className="mt-1 text-xl font-bold text-[#5B7FFF]">{formatCurrency(c.price)}</div>
                    {!isWorst && save > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-green-400 text-sm">
                        <TrendingDown className="h-3.5 w-3" />
                        Save {formatCurrency(save)}
                      </div>
                    )}
                  </div>
                  {isBest && (
                    <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400 flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> Best
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
