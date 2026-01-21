'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Fuel, Wrench, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { estimateOwnershipCosts } from '@/lib/carSpecifications'
import { motion } from 'framer-motion'

interface CarInput {
  name: string
  price: number
  mileage: number
  fuelEconomyCity: number
  fuelEconomyHighway: number
  fuelType?: string
}

interface OwnershipCostsSectionProps {
  cars: CarInput[]
  bestDealIndex?: number
}

export function OwnershipCostsSection({ cars, bestDealIndex = 0 }: OwnershipCostsSectionProps) {
  const withCosts = cars.map(c => ({
    ...c,
    ...estimateOwnershipCosts({
      price: c.price,
      mileage: c.mileage,
      fuelEconomyCity: c.fuelEconomyCity || 25,
      fuelEconomyHighway: c.fuelEconomyHighway || 33,
      fuelType: c.fuelType,
    }),
  }))
  const bestTco = Math.min(...withCosts.map(c => c.total5yr)) || 0

  return (
    <Card className="border-[#2a2d3a] bg-gradient-to-br from-[#1a1d29] to-[#0f1117] overflow-visible">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PieChart className="h-5 w-5 text-[#5B7FFF]" />
          5‑Year Ownership Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withCosts.map((c, i) => {
            const isBest = c.total5yr <= bestTco * 1.02
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
                  <div className="flex justify-between items-center">
                    <span className="text-[#94a3b8] flex items-center gap-1"><Fuel className="h-3.5 w-3" /> Fuel (5yr)</span>
                    <span className="text-white">{formatCurrency(c.fuel)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#94a3b8] flex items-center gap-1"><Wrench className="h-3.5 w-3" /> Maint. (5yr)</span>
                    <span className="text-white">{formatCurrency(c.maintenance * 5)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#94a3b8] flex items-center gap-1"><Shield className="h-3.5 w-3" /> Insurance (5yr)</span>
                    <span className="text-white">{formatCurrency(c.insurance * 5)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#2a2d3a] flex justify-between font-semibold text-[#5B7FFF]">
                    <span>Total (5yr)</span>
                    <span>{formatCurrency(c.total5yr)}{isBest ? ' ✓' : ''}</span>
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
