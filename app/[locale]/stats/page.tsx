"use client"


export const runtime = 'edge';
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, ReferenceLine, Area, AreaChart } from 'recharts'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronDown, Download, Trophy, Fuel, TrendingUp, TrendingDown, Sparkles,
  Car, DollarSign, Calendar, BarChart3, Share2, RefreshCw, Database,
  Zap, Award, Target, Activity, Loader2, ArrowUp, ArrowDown
} from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView || end === 0) return

    let startTime: number | null = null
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(start + (end - start) * easeOutQuart))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration, start])

  return { count, ref }
}

// Typing animation hook
const useTypingAnimation = (text: string, speed: number = 50) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || isComplete) return

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [isInView, text, speed, isComplete])

  return { displayedText, ref, isComplete }
}

export default function StatsPage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [statsSummary, setStatsSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all_time')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hooks must be called unconditionally
  const t = useTranslations('stats')
  const tCommon = useTranslations('common')
  const toastHook = useToast()
  const toast = toastHook || { toast: () => { } }

  // Count-up animations - MUST be before conditional return
  const totalCars = useCountUp(stats?.total_cars || 0, 2000)
  const avgPrice = useCountUp(stats?.average_price || 0, 2000)
  const medianPrice = useCountUp(stats?.median_price || 0, 2000)

  // Typing animation for subtitle - MUST be before conditional return
  const typingSubtitle = useTypingAnimation('Comprehensive insights into our car price dataset', 30)

  // Price distribution data - MUST be before conditional return
  const priceDistribution = useMemo(() => {
    if (!statsSummary?.price_distribution) {
      return [
        { range: '0-10k', count: 5000 },
        { range: '10-20k', count: 15000 },
        { range: '20-30k', count: 20000 },
        { range: '30-40k', count: 12000 },
        { range: '40-50k', count: 8000 },
        { range: '50-60k', count: 3000 },
        { range: '60k+', count: 1181 },
      ]
    }
    return statsSummary.price_distribution
  }, [statsSummary])

  // Calculate key insights - MUST be before conditional return
  const keyInsights = useMemo(() => {
    if (!statsSummary || !stats) return []

    const insights = []

    try {
      if (statsSummary.top_makes && Array.isArray(statsSummary.top_makes) && statsSummary.top_makes.length > 0) {
        const topMake = statsSummary.top_makes[0]
        if (topMake && topMake.make && topMake.count) {
          insights.push({
            icon: Trophy,
            text: `Most popular make: ${topMake.make} (${formatNumber(topMake.count)} cars)`,
            color: 'text-yellow-400',
          })
        }
      }

      if (statsSummary.price_trends_by_year && Array.isArray(statsSummary.price_trends_by_year) && statsSummary.price_trends_by_year.length > 1) {
        const recent = statsSummary.price_trends_by_year.slice(-2).filter((item: any) => item && item.average_price)
        if (recent.length === 2 && recent[0].average_price > 0) {
          const change = ((recent[1].average_price - recent[0].average_price) / recent[0].average_price) * 100
          const isPositive = change > 0
          insights.push({
            icon: isPositive ? TrendingUp : TrendingDown,
            text: `Price ${isPositive ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(1)}% this year`,
            color: isPositive ? 'text-green-400' : 'text-red-400',
          })
        }
      }

      if (stats.year_range && stats.year_range.min && stats.year_range.max) {
        const midYear = Math.floor((stats.year_range.min + stats.year_range.max) / 2)
        insights.push({
          icon: Target,
          text: `Best value: Cars from ${midYear - 2}-${midYear + 2}`,
          color: 'text-blue-400',
        })
      }
    } catch (error) {
      console.error('Error calculating key insights:', error)
    }

    return insights
  }, [statsSummary, stats])

  // Define functions before useEffect hooks that use them
  const loadStats = async () => {
    try {
      const data = await apiClient.getStats()
      if (data && typeof data === 'object') {
        setStats(data)
        setLastRefresh(new Date())
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error loading stats:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to load statistics',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStatsSummary = async () => {
    try {
      const data = await apiClient.getStatsSummary()
      if (data && typeof data === 'object') {
        setStatsSummary(data)
      } else {
        // Use fallback data if available
        setStatsSummary(null)
      }
    } catch (error: any) {
      console.error('Error loading stats summary:', error)
      // Non-critical error, continue without summary
      setStatsSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  // useEffect hooks - MUST be before conditional return
  useEffect(() => {
    loadStats()
    loadStatsSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await Promise.all([loadStats(), loadStatsSummary()])
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Statistics refreshed successfully',
        })
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Failed to refresh statistics',
          variant: 'destructive',
        })
      }
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportAll = () => {
    if (toast?.toast) {
      toast.toast({
        title: 'Exporting...',
        description: 'Preparing data export',
      })
    }
    // TODO: Implement export functionality
  }

  const handleShare = async () => {
    try {
      if (typeof window === 'undefined' || !navigator?.clipboard) {
        throw new Error('Clipboard API not available')
      }
      await navigator.clipboard.writeText(window.location.href)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Link copied to clipboard',
        })
      }
    } catch (error: any) {
      console.error('Share error:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to copy link',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDownloadVisualization = () => {
    if (toast?.toast) {
      toast.toast({
        title: (tCommon && typeof tCommon === 'function' ? tCommon('comingSoon') : null) || 'Coming Soon',
        description: 'Visualization download feature will be available soon',
      })
    }
  }

  // Colors for charts with gradients
  const COLORS = ['#5B7FFF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d29] to-[#0f1117]">
        <div className="container py-8 md:py-12">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#5B7FFF]" />
            {(tCommon && typeof tCommon === 'function' ? tCommon('loading') : null) || 'Loading...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d29] to-[#0f1117]">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-16 md:py-24"
      >
        {/* Animated Background Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ x: -100, y: Math.random() * 600 }}
              animate={{
                x: [2000, -100],
                y: [Math.random() * 600, Math.random() * 600],
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5,
              }}
            >
              <Database className="h-12 w-12 text-white/10" />
            </motion.div>
          ))}
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-cyan-100"
            >
              {(t && typeof t === 'function' ? t('title') : null) || 'Statistics Dashboard'}
            </motion.h1>
            <motion.p
              ref={typingSubtitle.ref}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-4"
            >
              {typingSubtitle.displayedText}
              {!typingSubtitle.isComplete && <span className="animate-pulse">|</span>}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-4 text-white/80 text-sm flex-wrap"
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>{formatNumber(stats?.total_cars || 0)} vehicles</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{stats?.year_range?.min || 'N/A'} - {stats?.year_range?.max || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Updated {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px] border-white/20 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                  <SelectItem value="all_time" className="text-white">All Time</SelectItem>
                  <SelectItem value="last_year" className="text-white">Last Year</SelectItem>
                  <SelectItem value="custom" className="text-white">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleExportAll}
                className="bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] hover:from-[#5B7FFF]/90 hover:to-[#8B5CF6]/90 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </motion.div>

          {/* Key Insights */}
          {keyInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {keyInsights.map((insight, idx) => {
                      const Icon = insight.icon
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <Icon className={`h-5 w-5 ${insight.color}`} />
                          <p className="text-white/80 text-sm">{insight.text}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Summary Stats Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20 backdrop-blur-xl hover:border-[#5B7FFF]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#5B7FFF]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5B7FFF]/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                    <Car className="h-5 w-5 text-[#5B7FFF]" />
                    {(t && typeof t === 'function' ? t('totalCars') : null) || 'Total Cars'}
                  </CardTitle>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="h-4 w-4 text-green-400" />
                  </motion.div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div ref={totalCars.ref} className="text-3xl font-bold text-white mb-1">
                    {formatNumber(totalCars.count)}
                  </div>
                  <p className="text-xs text-white/50">Total vehicles in dataset</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-gradient-to-br from-[#8B5CF6]/20 to-[#EC4899]/20 backdrop-blur-xl hover:border-[#8B5CF6]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#8B5CF6]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#8B5CF6]" />
                    {(t && typeof t === 'function' ? t('averagePrice') : null) || 'Average Price'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div ref={avgPrice.ref} className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] mb-1">
                    {formatCurrency(avgPrice.count)}
                  </div>
                  <p className="text-xs text-white/50">Average market price</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-gradient-to-br from-[#EC4899]/20 to-[#F59E0B]/20 backdrop-blur-xl hover:border-[#EC4899]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#EC4899]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#EC4899]" />
                    {(t && typeof t === 'function' ? t('medianPrice') : null) || 'Median Price'}
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div ref={medianPrice.ref} className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(medianPrice.count)}
                  </div>
                  <p className="text-xs text-white/50">Median price point</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 backdrop-blur-xl hover:border-[#10B981]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#10B981]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#10B981]" />
                    {(t && typeof t === 'function' ? t('yearRange') : null) || 'Year Range'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats?.year_range?.min || 'N/A'} - {stats?.year_range?.max || 'N/A'}
                  </div>
                  <p className="text-xs text-white/50">Year coverage span</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Price Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#5B7FFF]" />
                    {(t && typeof t === 'function' ? t('priceDistribution') : null) || 'Price Distribution'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadVisualization}
                    className="text-white/70 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceDistribution}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5B7FFF" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.9} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff/10" />
                        <XAxis dataKey="range" stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                        <YAxis stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(26, 29, 41, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            backdropFilter: 'blur(10px)',
                          }}
                        />
                        {stats?.average_price && (
                          <ReferenceLine
                            y={Math.floor(stats.average_price / 1000) * 1000}
                            stroke="#10B981"
                            strokeDasharray="5 5"
                            label={{ value: 'Avg', position: 'right', fill: '#10B981' }}
                          />
                        )}
                        <Bar
                          dataKey="count"
                          fill="url(#priceGradient)"
                          radius={[8, 8, 0, 0]}
                        >
                          {priceDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Car Makes */}
            <Collapsible defaultOpen>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-white/5 transition-colors rounded-t-lg">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#F59E0B]" />
                        {(t && typeof t === 'function' ? t('topMakes') : null) || 'Top Makes'}
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {summaryLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#5B7FFF]" />
                        </div>
                      ) : statsSummary?.top_makes && Array.isArray(statsSummary.top_makes) && statsSummary.top_makes.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsSummary.top_makes.filter((item: any) => item && item.make && item.count)} layout="vertical">
                              <defs>
                                <linearGradient id="makeGradient" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#5B7FFF" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.9} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff/10" />
                              <XAxis type="number" stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                              <YAxis dataKey="make" type="category" stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} width={100} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(26, 29, 41, 0.95)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  backdropFilter: 'blur(10px)',
                                }}
                              />
                              <Bar dataKey="count" fill="url(#makeGradient)" radius={[0, 8, 8, 0]}>
                                {statsSummary.top_makes.filter((item: any) => item && item.make && item.count).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-white/50 py-8 text-center">No data available</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </motion.div>
            </Collapsible>

            {/* Fuel Type Distribution */}
            <Collapsible>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-white/5 transition-colors rounded-t-lg">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Fuel className="h-5 w-5 text-[#10B981]" />
                        {(t && typeof t === 'function' ? t('fuelTypeDistribution') : null) || 'Fuel Type Distribution'}
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {summaryLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#5B7FFF]" />
                        </div>
                      ) : statsSummary?.fuel_type_distribution && Array.isArray(statsSummary.fuel_type_distribution) && statsSummary.fuel_type_distribution.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <defs>
                                {statsSummary.fuel_type_distribution.filter((item: any) => item && item.fuel_type && item.count).map((_: any, index: number) => (
                                  <linearGradient key={`fuelGradient-${index}`} id={`fuelGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={COLORS[(index + 1) % COLORS.length]} stopOpacity={0.9} />
                                  </linearGradient>
                                ))}
                              </defs>
                              <Pie
                                data={statsSummary.fuel_type_distribution.filter((item: any) => item && item.fuel_type && item.count)}
                                dataKey="count"
                                nameKey="fuel_type"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                label={({ fuel_type, percentage }: any) => `${fuel_type || 'Unknown'}: ${percentage || 0}%`}
                              >
                                {statsSummary.fuel_type_distribution.filter((item: any) => item && item.fuel_type && item.count).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={`url(#fuelGradient-${index})`} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(26, 29, 41, 0.95)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  backdropFilter: 'blur(10px)',
                                }}
                              />
                              <Legend
                                wrapperStyle={{ color: '#ffffff' }}
                                iconType="circle"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-white/50 py-8 text-center">No data available</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </motion.div>
            </Collapsible>

            {/* Price Trends by Year */}
            <Collapsible>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-white/5 transition-colors rounded-t-lg">
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#EC4899]" />
                        {(t && typeof t === 'function' ? t('priceTrendsByYear') : null) || 'Price Trends by Year'}
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {summaryLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#5B7FFF]" />
                        </div>
                      ) : statsSummary?.price_trends_by_year && Array.isArray(statsSummary.price_trends_by_year) && statsSummary.price_trends_by_year.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsSummary.price_trends_by_year.filter((item: any) => item && item.year && item.average_price)}>
                              <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#5B7FFF" stopOpacity={0.3} />
                                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#5B7FFF" />
                                  <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff/10" />
                              <XAxis dataKey="year" stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                              <YAxis stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(26, 29, 41, 0.95)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  backdropFilter: 'blur(10px)',
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Area
                                type="monotone"
                                dataKey="average_price"
                                stroke="url(#lineStroke)"
                                fill="url(#lineGradient)"
                                strokeWidth={3}
                              />
                              <Line
                                type="monotone"
                                dataKey="average_price"
                                stroke="url(#lineStroke)"
                                strokeWidth={3}
                                dot={{ fill: '#5B7FFF', r: 5 }}
                                activeDot={{ r: 8 }}
                                name="Average Price"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-white/50 py-8 text-center">No data available</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </motion.div>
            </Collapsible>

            {/* Price by Condition */}
            <Collapsible>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between hover:bg-white/5 transition-colors rounded-t-lg">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                        {(t && typeof t === 'function' ? t('priceByCondition') : null) || 'Price by Condition'}
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      {summaryLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#5B7FFF]" />
                        </div>
                      ) : statsSummary?.price_by_condition && Array.isArray(statsSummary.price_by_condition) && statsSummary.price_by_condition.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsSummary.price_by_condition.filter((item: any) => item && item.condition && item.average_price)}>
                              <defs>
                                <linearGradient id="conditionGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.9} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff/10" />
                              <XAxis dataKey="condition" stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                              <YAxis stroke="#ffffff/50" tick={{ fill: '#ffffff/70' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(26, 29, 41, 0.95)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  backdropFilter: 'blur(10px)',
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Bar dataKey="average_price" fill="url(#conditionGradient)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-white/50 py-8 text-center">No data available</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </motion.div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  )
}
