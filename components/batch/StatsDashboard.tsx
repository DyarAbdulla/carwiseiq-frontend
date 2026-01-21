'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { BatchPredictionResult } from '@/lib/types'

interface ExtendedResult extends BatchPredictionResult {
  confidence_percent?: number
  deal_rating?: 'Good' | 'Fair' | 'Poor'
}

interface StatsDashboardProps {
  results: ExtendedResult[]
}

const COLORS = {
  good: '#10B981',
  fair: '#F59E0B',
  poor: '#EF4444',
  primary: '#5B7FFF',
  secondary: '#8B5CF6',
}

export function StatsDashboard({ results }: StatsDashboardProps) {
  const chartData = useMemo(() => {
    if (results.length === 0) return null

    const successful = results.filter((r) => !r.error)

    // Price Distribution Data
    const priceRanges = [
      { range: '$0-10k', min: 0, max: 10000, count: 0 },
      { range: '$10k-20k', min: 10000, max: 20000, count: 0 },
      { range: '$20k-30k', min: 20000, max: 30000, count: 0 },
      { range: '$30k-50k', min: 30000, max: 50000, count: 0 },
      { range: '$50k-75k', min: 50000, max: 75000, count: 0 },
      { range: '$75k+', min: 75000, max: Infinity, count: 0 },
    ]

    successful.forEach((result) => {
      const price = result.predicted_price
      for (const range of priceRanges) {
        if (price >= range.min && price < range.max) {
          range.count++
          break
        }
      }
    })

    // Deal Quality Data
    const dealQualityCounts = {
      Good: results.filter((r) => !r.error && r.deal_rating === 'Good').length,
      Fair: results.filter((r) => !r.error && r.deal_rating === 'Fair').length,
      Poor: results.filter((r) => !r.error && r.deal_rating === 'Poor').length,
    }

    const dealQualityData = Object.entries(dealQualityCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))

    // Confidence Score Distribution
    const confidenceRanges = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '20-40%', min: 20, max: 40, count: 0 },
      { range: '40-60%', min: 40, max: 60, count: 0 },
      { range: '60-80%', min: 60, max: 80, count: 0 },
      { range: '80-100%', min: 80, max: 100, count: 0 },
    ]

    successful.forEach((result) => {
      const confidence = result.confidence_percent ?? 0
      for (const range of confidenceRanges) {
        if (confidence >= range.min && confidence < range.max) {
          range.count++
          break
        }
      }
    })

    // Best and Worst Deals
    const sortedByPrice = [...successful].sort((a, b) => a.predicted_price - b.predicted_price)
    const bestDeal = sortedByPrice.find((r) => r.deal_rating === 'Good') || sortedByPrice[0]
    const worstDeal =
      sortedByPrice.reverse().find((r) => r.deal_rating === 'Poor') || sortedByPrice[0]

    return {
      priceDistribution: priceRanges,
      dealQuality: dealQualityData,
      confidenceDistribution: confidenceRanges,
      bestDeal,
      worstDeal,
    }
  }, [results])

  if (!chartData || results.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Best/Worst Deals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chartData.bestDeal && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <CardTitle className="text-green-500">Best Deal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">
                {chartData.bestDeal.car.make} {chartData.bestDeal.car.model}
              </p>
              <p className="text-2xl font-bold text-green-500 mt-2">
                {formatCurrency(chartData.bestDeal.predicted_price)}
              </p>
              <p className="text-sm text-[#94a3b8] mt-1">
                {chartData.bestDeal.car.year} • {chartData.bestDeal.car.mileage.toLocaleString()} km
              </p>
            </CardContent>
          </Card>
        )}

        {chartData.worstDeal && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <CardTitle className="text-red-500">Overpriced</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">
                {chartData.worstDeal.car.make} {chartData.worstDeal.car.model}
              </p>
              <p className="text-2xl font-bold text-red-500 mt-2">
                {formatCurrency(chartData.worstDeal.predicted_price)}
              </p>
              <p className="text-sm text-[#94a3b8] mt-1">
                {chartData.worstDeal.car.year} • {chartData.worstDeal.car.mileage.toLocaleString()} km
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Distribution */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29]">
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Number of cars by price range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1d29',
                    border: '1px solid #2a2d3a',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Quality */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29]">
          <CardHeader>
            <CardTitle>Deal Quality</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Breakdown of deal quality ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.dealQuality}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.dealQuality.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'Good'
                          ? COLORS.good
                          : entry.name === 'Fair'
                          ? COLORS.fair
                          : COLORS.poor
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1d29',
                    border: '1px solid #2a2d3a',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29] lg:col-span-2">
          <CardHeader>
            <CardTitle>Confidence Score Distribution</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Distribution of prediction confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1d29',
                    border: '1px solid #2a2d3a',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
