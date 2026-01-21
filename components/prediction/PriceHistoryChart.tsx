"use client"

import { Suspense, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { MarketTrend } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

function ChartRenderer({ data }: { data: { month: string; price: number }[] }) {
  const [components, setComponents] = useState<{
    ResponsiveContainer: React.ComponentType<any>
    LineChart: React.ComponentType<any>
    Line: React.ComponentType<any>
    XAxis: React.ComponentType<any>
    YAxis: React.ComponentType<any>
    CartesianGrid: React.ComponentType<any>
    Tooltip: React.ComponentType<any>
  } | null>(null)

  useEffect(() => {
    import('recharts').then((mod: any) => {
      setComponents({
        ResponsiveContainer: mod.ResponsiveContainer,
        LineChart: mod.LineChart,
        Line: mod.Line,
        XAxis: mod.XAxis,
        YAxis: mod.YAxis,
        CartesianGrid: mod.CartesianGrid,
        Tooltip: mod.Tooltip,
      })
    })
  }, [])

  if (!components) {
    return <Skeleton className="h-full w-full" />
  }

  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } = components

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
        <Tooltip contentStyle={{ backgroundColor: '#1a1d29', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => formatCurrency(v)} />
        <Line type="monotone" dataKey="price" stroke="#5B7FFF" strokeWidth={2} dot={{ fill: '#5B7FFF', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface PriceHistoryChartProps {
  trends: MarketTrend[]
  compact?: boolean
}

export function PriceHistoryChart({ trends, compact }: PriceHistoryChartProps) {
  if (!trends || trends.length === 0) return null

  const chartData = trends.map(t => ({ month: t.month, price: Math.round(t.average_price) }))

  return (
    <Card className="border-[#2a2d3a] bg-[#1a1d29]">
      {!compact && (
        <CardHeader>
          <CardTitle className="text-white text-lg">Price History Trends</CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'pt-4' : undefined}>
        <div className={compact ? 'h-48 w-full' : 'h-64 w-full'}>
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <ChartRenderer data={chartData} />
          </Suspense>
        </div>
        <p className="text-xs text-[#94a3b8] mt-4 text-center">Price trends over the last {trends.length} months</p>
      </CardContent>
    </Card>
  )
}
