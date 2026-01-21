'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart2, Activity } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type ChartMode = 'price' | 'performance' | 'radar'

interface ChartItem {
  name: string
  shortName: string
  price?: number
  horsepower?: number
  fuelEconomy?: number
  acceleration?: number
  value?: number
  economy?: number
  fullName: string
  isBestDeal?: boolean
  isMostExpensive?: boolean
}

interface ComparisonChartProps {
  data: ChartItem[]
  format?: (v: number) => string
  onModeChange?: (mode: ChartMode) => void
}

const COLORS = {
  best: '#10B981',
  worst: '#EF4444',
  middle: '#5B7FFF',
  radar: ['#5B7FFF', '#8B5CF6', '#EC4899', '#F59E0B'],
}

export function ComparisonChart({ data, onModeChange }: ComparisonChartProps) {
  const [mode, setMode] = useState<ChartMode>('price')

  const getBarColor = (entry: ChartItem, idx: number) => {
    if (entry.isBestDeal) return COLORS.best
    if (entry.isMostExpensive) return COLORS.worst
    return COLORS.radar[idx % COLORS.radar.length]
  }

  // Radar: normalize each dimension to 0–100 for display
  const radarData = (() => {
    if (data.length === 0) return []
    const keys = ['price', 'horsepower', 'fuelEconomy', 'acceleration', 'value', 'economy'] as const
    const out: { subject: string; [k: string]: number | string }[] = []
    const labels: Record<string, string> = {
      price: 'Price (low=best)',
      horsepower: 'Power',
      fuelEconomy: 'L/100km',
      acceleration: '0-60 (fast=best)',
      value: 'Value',
      economy: 'Economy',
    }
    for (const k of keys) {
      const vals = data.map(d => {
        const v = d[k]
        if (v == null) return 0
        if (k === 'price' || k === 'acceleration') return 100 - Math.min(100, (v / (k === 'price' ? 50000 : 10)) * 50)
        // fuelEconomy/economy: L/100km, lower is better → invert: 100 - v*8, typical 5–15
        if (k === 'fuelEconomy' || k === 'economy') return Math.max(0, Math.min(100, 120 - (v as number) * 8))
        return Math.min(100, (v / (k === 'horsepower' ? 400 : 100)) * 100)
      })
      const o: { subject: string; [k: string]: number | string } = { subject: labels[k] || k }
      data.forEach((d, i) => { o[`car${i}`] = vals[i] })
      out.push(o)
    }
    return out
  })()

  return (
    <Card className="border-[#2a2d3a] bg-[#1a1d29]/80 backdrop-blur-sm overflow-visible">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-white text-lg">Comparison Charts</CardTitle>
          <div className="flex rounded-lg bg-[#0f1117] p-1 border border-[#2a2d3a]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode('price'); onModeChange?.('price') }}
              className={`rounded-md ${mode === 'price' ? 'bg-[#5B7FFF] text-white' : 'text-[#94a3b8] hover:text-white'}`}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Price
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode('performance'); onModeChange?.('performance') }}
              className={`rounded-md ${mode === 'performance' ? 'bg-[#5B7FFF] text-white' : 'text-[#94a3b8] hover:text-white'}`}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" />
              Perf
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode('radar'); onModeChange?.('radar') }}
              className={`rounded-md ${mode === 'radar' ? 'bg-[#5B7FFF] text-white' : 'text-[#94a3b8] hover:text-white'}`}
            >
              <Activity className="h-4 w-4 mr-1.5" />
              Radar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {mode === 'price' && (
            <motion.div
              key="price"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="shortName" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1a1d29', border: '1px solid #2a2d3a', borderRadius: 8, color: '#fff' }}
                    formatter={(v: number, _n: string, p: unknown) => [formatCurrency(v), (p as { payload?: ChartItem })?.payload?.fullName ?? '']}
                  />
                  <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                    {data.map((entry, i) => (
                      <Cell key={`c-${i}`} fill={getBarColor(entry, i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {mode === 'performance' && (
            <motion.div
              key="perf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.map(d => ({ ...d, hp: d.horsepower ?? 0, l100: d.fuelEconomy ?? 0 }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="shortName" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="L" stroke="#5B7FFF" tick={{ fill: '#94a3b8' }} />
                  <YAxis yAxisId="R" orientation="right" stroke="#10B981" tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1d29', border: '1px solid #2a2d3a', borderRadius: 8, color: '#fff' }}
                    formatter={(v: number, n: string) => [n === 'hp' ? `${v} hp` : `${Number(v).toFixed(1)} L/100km`, '']}
                  />
                  <Bar yAxisId="L" dataKey="hp" name="horsepower" fill="#5B7FFF" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="R" dataKey="l100" name="fuel economy (L/100km)" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {mode === 'radar' && radarData.length > 0 && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[320px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2d3a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  {data.map((_, i) => (
                    <Radar key={i} name={data[i].shortName} dataKey={`car${i}`} stroke={COLORS.radar[i % COLORS.radar.length]} fill={COLORS.radar[i % COLORS.radar.length]} fillOpacity={0.2} strokeWidth={2} />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
