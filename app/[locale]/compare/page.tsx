"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PredictionForm } from '@/components/prediction/PredictionForm'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { X, Plus, Download, Share2, Save, Trophy, TrendingDown, TrendingUp, Sparkles, Check, X as XIcon, Gauge, Fuel, Cog, Calendar, Shield } from 'lucide-react'
import type { CarFeatures, PredictionResponse } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, mpgToL100km, formatFuelEconomyL100km } from '@/lib/utils'
import Image from 'next/image'
import { ListingCardSkeleton } from '@/components/common/LoadingSkeleton'
import { getCarSpecs } from '@/lib/carSpecifications'
import { ComparisonChart } from '@/components/compare/ComparisonChart'
import { SpecificationTable } from '@/components/compare/SpecificationTable'
import { ValueAnalysisSection } from '@/components/compare/ValueAnalysisSection'
import { OwnershipCostsSection } from '@/components/compare/OwnershipCostsSection'
import { CompareSummaryCards } from '@/components/compare/CompareSummaryCards'
import { SmartRecommendations } from '@/components/compare/SmartRecommendations'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ExportPDF } from '@/components/compare/ExportPDF'
import { ShareComparison } from '@/components/compare/ShareComparison'
import { CompareSaveAndHistory } from '@/components/compare/CompareSaveAndHistory'
import { saveCompareToHistory, type CompareHistoryEntry } from '@/lib/compareHistory'
import { parseCompareUrl } from '@/lib/shareUtils'

interface CarCard {
  id: string
  features: CarFeatures | null
  prediction: PredictionResponse | null
  loading: boolean
}

interface ListingCard {
  id: number
  listing_id: number
  make: string
  model: string
  year: number
  price: number
  mileage: number
  condition: string
  fuel_type: string
  transmission: string
  color: string
  features: string[]
  image_url?: string
  location_city?: string
  description?: string
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const listingIds = searchParams?.get('ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) || []
  const isMarketplaceComparison = listingIds.length > 0

  const [mounted, setMounted] = useState(false)
  const [cars, setCars] = useState<CarCard[]>([
    { id: '1', features: null, prediction: null, loading: false },
  ])
  const [listings, setListings] = useState<ListingCard[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [predictingAll, setPredictingAll] = useState(false)
  const [highlightDifferencesOnly, setHighlightDifferencesOnly] = useState(false)

  const MAX_CARS = 4

  // ALL hooks must be called unconditionally BEFORE any conditional returns
  const t = useTranslations('compare')
  const tCommon = useTranslations('common')
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Restore prediction comparison from share URL (?type=pred&d=...)
  useEffect(() => {
    if (!mounted || !searchParams || listingIds.length > 0) return
    const parsed = parseCompareUrl(searchParams)
    if (parsed?.mode === 'prediction' && parsed.state?.cars?.length) {
      setCars(parsed.state.cars.map((c, i) => ({
        id: `load-${i}-${Date.now()}`,
        features: c.features as CarFeatures | null,
        prediction: c.prediction as PredictionResponse | null,
        loading: false,
      })))
      router.replace(`/${locale}/compare`)
    }
  }, [mounted, searchParams, listingIds.length, router, locale])

  // Load marketplace listings if IDs provided
  const loadListings = useCallback(async () => {
    setLoadingListings(true)
    try {
      const listingPromises = listingIds.map(id => apiClient.getListing(id))
      const listingResults = await Promise.all(listingPromises)
      const validListings: ListingCard[] = listingResults
        .filter((listing: any) => listing && listing.id)
        .map((listing: any) => ({
          id: listing.id,
          listing_id: listing.id,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          price: listing.price,
          mileage: listing.mileage,
          condition: listing.condition,
          fuel_type: listing.fuel_type,
          transmission: listing.transmission,
          color: listing.color,
          features: listing.features || [],
          image_url: listing.images?.[0]?.url,
          location_city: listing.location_city,
          description: listing.description,
        }))
      setListings(validListings)
    } catch (error: any) {
      console.error('Error loading listings:', error)
      if (toast?.toast) {
        toast.toast({
          title: 'Error',
          description: 'Failed to load listings for comparison',
          variant: 'destructive',
        })
      }
    } finally {
      setLoadingListings(false)
    }
  }, [listingIds, toast])

  const listingIdsKey = listingIds.join(',')

  useEffect(() => {
    if (isMarketplaceComparison && listingIds.length > 0) {
      loadListings()
    }
  }, [isMarketplaceComparison, listingIdsKey, listingIds.length, loadListings])

  // Calculate comparison metrics - MUST be before conditional return
  const allCarsHavePredictions = cars.every(c => c.prediction && c.features)
  const hasMultipleCars = cars.length > 1

  const comparisonMetrics = useMemo(() => {
    if (!allCarsHavePredictions || !hasMultipleCars) return null

    const carsWithPrices = cars
      .map((car, index) => ({
        ...car,
        index: index + 1,
        price: car.prediction?.predicted_price || 0,
        confidence: car.prediction?.confidence_range || 0,
      }))
      .sort((a, b) => a.price - b.price)

    const bestDealIndex = carsWithPrices[0].index - 1
    const mostExpensiveIndex = carsWithPrices[carsWithPrices.length - 1].index - 1
    const avgPrice = carsWithPrices.reduce((sum, car) => sum + car.price, 0) / carsWithPrices.length

    // Calculate savings for each car vs most expensive
    const savings = cars.map((car, index) => {
      if (index === mostExpensiveIndex) return 0
      const thisPrice = car.prediction?.predicted_price || 0
      const maxPrice = carsWithPrices[carsWithPrices.length - 1].price
      return maxPrice - thisPrice
    })

    // Generate AI recommendation
    const bestCar = cars[bestDealIndex]
    const recommendation = bestCar.features && bestCar.prediction
      ? `Based on the comparison, **Car ${bestDealIndex + 1} (${bestCar.features.make} ${bestCar.features.model})** offers the best value. At ${formatCurrency(bestCar.prediction.predicted_price)}, it's ${formatCurrency(savings[bestDealIndex])} less expensive than the most expensive option. ${
          bestCar.features.condition === 'Excellent' || bestCar.features.condition === 'Very Good'
            ? 'Its excellent condition also ensures good long-term reliability.'
            : ''
        } This represents the best balance of price and features among your options.`
      : ''

    return {
      bestDealIndex,
      mostExpensiveIndex,
      avgPrice,
      savings,
      recommendation,
      carsWithPrices,
    }
  }, [cars, allCarsHavePredictions, hasMultipleCars])

  // Specs from getCarSpecs for each car (prediction mode)
  const specMaps = useMemo(() =>
    cars.map(c => c.features ? getCarSpecs({
      make: c.features.make,
      model: c.features.model,
      year: c.features.year,
      engine_size: c.features.engine_size,
      cylinders: c.features.cylinders,
      fuel_type: c.features.fuel_type,
    }) : null),
  [cars])

  // Chart data with price, performance, radar dimensions
  const chartData = useMemo(() => {
    if (!comparisonMetrics) return []
    return cars.map((car, index) => {
      const spec = specMaps[index]
      const fe = spec?.fuelEconomy
      const avgMpg = fe ? (fe.city + fe.highway) / 2 : 0
      return {
        name: `Car ${index + 1}`,
        shortName: car.features ? `${car.features.make} ${car.features.model}`.slice(0, 14) : `Car ${index + 1}`,
        price: car.prediction?.predicted_price || 0,
        horsepower: spec?.horsepower,
        fuelEconomy: fe ? mpgToL100km(avgMpg) : undefined,
        acceleration: spec?.acceleration,
        value: spec?.horsepower && car.prediction?.predicted_price ? Math.round(car.prediction.predicted_price / spec.horsepower) : undefined,
        economy: fe ? mpgToL100km(avgMpg) : undefined,
        fullName: `${car.features?.make || ''} ${car.features?.model || ''}`.trim() || `Car ${index + 1}`,
        isBestDeal: index === comparisonMetrics.bestDealIndex,
        isMostExpensive: index === comparisonMetrics.mostExpensiveIndex,
      }
    })
  }, [cars, comparisonMetrics, specMaps])

  // Spec table rows for prediction comparison
  const specRows = useMemo(() => {
    if (!allCarsHavePredictions || !comparisonMetrics) return []
    const rows = [
      { label: 'Make & Model', values: cars.map(c => c.features ? `${c.features.make} ${c.features.model}` : '—') },
      { label: 'Year', values: cars.map(c => c.features?.year ?? '—'), icon: Calendar },
      { label: 'Mileage', values: cars.map(c => c.features?.mileage ?? null), suffix: ' km', format: (v: string | number) => Number(v).toLocaleString() },
      { label: 'Condition', values: cars.map(c => c.features?.condition ?? '—') },
      { label: 'Fuel Type', values: cars.map(c => c.features?.fuel_type ?? '—'), icon: Fuel },
      { label: 'Engine', values: cars.map(c => c.features?.engine_size ? `${c.features.engine_size}L` : '—'), icon: Cog },
      { label: 'Cylinders', values: cars.map(c => c.features?.cylinders ?? '—') },
      { label: 'Horsepower', values: cars.map((_, i) => specMaps[i]?.horsepower ?? null), higherIsBetter: true, suffix: ' hp', icon: Gauge },
      { label: 'Torque', values: cars.map((_, i) => specMaps[i]?.torque ?? null), higherIsBetter: true, suffix: ' lb-ft' },
      { label: '0-60 mph', values: cars.map((_, i) => specMaps[i]?.acceleration ?? null), suffix: ' s' },
      { label: 'Top Speed', values: cars.map((_, i) => specMaps[i]?.topSpeed ?? null), higherIsBetter: true, suffix: ' mph' },
      { label: 'Transmission', values: cars.map((_, i) => specMaps[i]?.transmission ?? '—') },
      { label: 'Drivetrain', values: cars.map((_, i) => specMaps[i]?.drivetrain ?? '—') },
      { label: 'Fuel Economy (L/100km)', values: cars.map((_, i) => { const e = specMaps[i]?.fuelEconomy; return e ? formatFuelEconomyL100km(e.city, e.highway) : '—' }) },
      { label: 'Predicted Price', values: cars.map(c => c.prediction?.predicted_price ?? null), format: (v: string | number) => formatCurrency(Number(v)) },
      { label: 'Confidence', values: cars.map(c => c.prediction?.confidence_range ?? null), higherIsBetter: true, suffix: '%' },
      { label: 'Savings vs Highest', values: comparisonMetrics.savings, format: (v: string | number) => formatCurrency(Number(v)), suffix: '' },
    ]
    if (highlightDifferencesOnly) {
      return rows.filter(r => {
        const v = r.values.map(x => String(x ?? ''))
        return new Set(v).size > 1
      })
    }
    return rows
  }, [cars, comparisonMetrics, specMaps, allCarsHavePredictions, highlightDifferencesOnly])

  const addCar = () => {
    if (cars.length >= MAX_CARS) {
      if (toast?.toast) {
        toast.toast({ title: 'Limit reached', description: `You can compare up to ${MAX_CARS} cars.`, variant: 'default' })
      }
      return
    }
    setCars([...cars, { id: Date.now().toString(), features: null, prediction: null, loading: false }])
  }

  const removeCar = (id: string) => {
    if (cars.length > 1) {
      setCars(cars.filter(car => car.id !== id))
    }
  }

  const handlePredict = async (id: string, features: CarFeatures | null) => {
    // Validate input
    if (!id || !features || typeof features !== 'object') {
      console.error('❌ [Compare] Invalid input:', { id, features })
      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: 'Invalid car features provided',
          variant: 'destructive',
        })
      }
      return
    }

    const carIndex = cars.findIndex(c => c.id === id)
    if (carIndex === -1) {
      console.error('❌ [Compare] Car not found:', id)
      return
    }

    setCars(prevCars => prevCars.map(c => c.id === id ? { ...c, loading: true } : c))

    try {
      const result = await apiClient.predictPrice(features)

      // Validate result
      if (!result || typeof result !== 'object' || typeof result.predicted_price !== 'number') {
        throw new Error('Invalid prediction result')
      }

      setCars(prevCars => prevCars.map(c => c.id === id ? { ...c, features, prediction: result, loading: false } : c))

      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('success') || 'Success',
          description: `Predicted: ${formatCurrency(result.predicted_price)}`,
        })
      }
    } catch (error: any) {
      console.error('❌ [Compare] Prediction failed:', error)
      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: error?.message || 'Failed to predict',
          variant: 'destructive',
        })
      }
      setCars(prevCars => prevCars.map(c => c.id === id ? { ...c, loading: false } : c))
    }
  }

  // FIXED: Predict All - predict all cars at once with one click
  const predictAll = async () => {
    try {
      const carsWithFeatures = cars.filter(c => c.features && c.features !== null && !c.prediction)

      if (carsWithFeatures.length === 0) {
        if (toast?.toast) {
          toast.toast({
            title: 'No Cars to Predict',
            description: 'All cars either have predictions or need features filled in',
            variant: 'default',
          })
        }
        return
      }

      setPredictingAll(true)

      // Set all cars to loading state
      setCars(prevCars => prevCars.map(c =>
        carsWithFeatures.some(cwf => cwf.id === c.id) ? { ...c, loading: true } : c
      ))

      try {
        // Predict all cars in parallel for better performance
        const predictionPromises = carsWithFeatures.map(async (car) => {
          if (car.features && car.features !== null) {
            try {
              const result = await apiClient.predictPrice(car.features)
              // Validate result
              if (result && typeof result === 'object' && typeof result.predicted_price === 'number') {
                return { id: car.id, success: true, result, features: car.features }
              } else {
                throw new Error('Invalid prediction result')
              }
            } catch (error: any) {
              console.error(`❌ [Compare] Prediction failed for car ${car.id}:`, error)
              return { id: car.id, success: false, error: error?.message || 'Prediction failed' }
            }
          }
          return { id: car.id, success: false, error: 'No features' }
        })

        const results = await Promise.all(predictionPromises)

        // Update state with all results at once
        setCars(prevCars => prevCars.map(c => {
          const result = results.find(r => r.id === c.id)
          if (result && result.success && result.result && result.features) {
            return { ...c, prediction: result.result, features: result.features, loading: false }
          } else if (result && !result.success) {
            return { ...c, loading: false }
          }
          return c
        }))

        const successCount = results.filter(r => r.success).length
        if (toast?.toast) {
          toast.toast({
            title: tCommon?.('success') || 'Success',
            description: `Successfully predicted ${successCount} car${successCount > 1 ? 's' : ''}`,
          })
        }
      } catch (error: any) {
        console.error('❌ [Compare] Predict All failed:', error)
        if (toast?.toast) {
          toast.toast({
            title: tCommon?.('error') || 'Error',
            description: error?.message || 'Failed to predict all cars',
            variant: 'destructive',
          })
        }
      } finally {
        setPredictingAll(false)
        // Ensure all loading states are cleared
        setCars(prevCars => prevCars.map(c => ({ ...c, loading: false })))
      }
    } catch (error: any) {
      console.error('❌ [Compare] Predict All outer error:', error)
      setPredictingAll(false)
      setCars(prevCars => prevCars.map(c => ({ ...c, loading: false })))
    }
  }

  const handleSaveCompare = (name: string) => {
    if (isMarketplaceComparison && marketplaceMetrics && listings.length >= 2) {
      saveCompareToHistory({ name, mode: 'marketplace', ids: listings.map(l => l.id) })
      toast?.toast?.({ title: 'Saved', description: 'Comparison saved to history.' })
    } else if (!isMarketplaceComparison && allCarsHavePredictions && hasMultipleCars) {
      saveCompareToHistory({
        name,
        mode: 'prediction',
        state: { cars: cars.map(c => ({ features: c.features, prediction: c.prediction })) },
      })
      toast?.toast?.({ title: 'Saved', description: 'Comparison saved to history.' })
    }
  }

  const handleLoadCompare = (entry: CompareHistoryEntry) => {
    if (entry.mode === 'marketplace' && entry.ids?.length) {
      router.replace(`/${locale}/compare?ids=${entry.ids.join(',')}`)
    } else if (entry.mode === 'prediction' && entry.state?.cars?.length) {
      setCars(entry.state.cars.map((c, i) => ({
        id: `h-${i}-${Date.now()}`,
        features: c.features as CarFeatures | null,
        prediction: c.prediction as PredictionResponse | null,
        loading: false,
      })))
      router.replace(`/${locale}/compare`)
    }
  }

  // Marketplace comparison metrics
  const marketplaceMetrics = useMemo(() => {
    if (!isMarketplaceComparison || listings.length < 2) return null

    const sortedByPrice = [...listings].sort((a, b) => a.price - b.price)
    const bestDealIndex = listings.findIndex(l => l.id === sortedByPrice[0].id)
    const mostExpensiveIndex = listings.findIndex(l => l.id === sortedByPrice[sortedByPrice.length - 1].id)
    const avgPrice = listings.reduce((sum, l) => sum + l.price, 0) / listings.length

    // Calculate winner based on value (price/features ratio)
    const winners = listings.map(listing => {
      const featureScore = listing.features.length
      const valueScore = (avgPrice / listing.price) * (1 + featureScore * 0.1)
      return { id: listing.id, valueScore }
    }).sort((a, b) => b.valueScore - a.valueScore)

    return {
      bestDealIndex,
      mostExpensiveIndex,
      avgPrice,
      winnerId: winners[0]?.id,
      savings: listings.map(listing => {
        const maxPrice = sortedByPrice[sortedByPrice.length - 1].price
        return maxPrice - listing.price
      }),
    }
  }, [listings, isMarketplaceComparison])

  // Get all unique features across all listings
  const allFeatures = useMemo(() => {
    if (!isMarketplaceComparison) return []
    const featureSet = new Set<string>()
    listings.forEach(listing => {
      listing.features.forEach(feature => featureSet.add(feature))
    })
    return Array.from(featureSet).sort()
  }, [listings, isMarketplaceComparison])

  // Marketplace: getCarSpecs, chart data, spec rows
  const listingSpecMaps = useMemo(
    () => listings.map(l => getCarSpecs({
      make: l.make,
      model: l.model,
      year: l.year,
      transmission: l.transmission,
      fuel_type: l.fuel_type,
    })),
    [listings]
  )
  const listingChartData = useMemo(() => {
    if (!marketplaceMetrics || listings.length < 2) return []
    return listings.map((l, i) => {
      const s = listingSpecMaps[i]
      const fe = s?.fuelEconomy
      const avgMpg = fe ? (fe.city + fe.highway) / 2 : 0
      return {
        name: `${l.make} ${l.model}`,
        shortName: `${l.make} ${l.model}`.slice(0, 14),
        price: l.price,
        horsepower: s?.horsepower,
        fuelEconomy: fe ? mpgToL100km(avgMpg) : undefined,
        fullName: `${l.make} ${l.model} ${l.year}`,
        isBestDeal: i === marketplaceMetrics.bestDealIndex,
        isMostExpensive: i === marketplaceMetrics.mostExpensiveIndex,
      }
    })
  }, [listings, marketplaceMetrics, listingSpecMaps])
  const listingSpecRows = useMemo(() => {
    if (!marketplaceMetrics || listings.length < 2) return []
    const rows = [
      { label: 'Make & Model', values: listings.map(l => `${l.make} ${l.model}`) },
      { label: 'Year', values: listings.map(l => l.year) },
      { label: 'Mileage', values: listings.map(l => l.mileage), suffix: ' km', format: (v: string | number) => Number(v).toLocaleString() },
      { label: 'Condition', values: listings.map(l => l.condition) },
      { label: 'Fuel Type', values: listings.map(l => l.fuel_type) },
      { label: 'Transmission', values: listings.map(l => l.transmission) },
      { label: 'Horsepower', values: listings.map((_, i) => listingSpecMaps[i]?.horsepower ?? null), higherIsBetter: true, suffix: ' hp' },
      { label: 'Fuel Economy (L/100km)', values: listings.map((_, i) => { const e = listingSpecMaps[i]?.fuelEconomy; return e ? formatFuelEconomyL100km(e.city, e.highway) : '—' }) },
      { label: 'Price', values: listings.map(l => l.price), format: (v: string | number) => formatCurrency(Number(v)) },
      { label: 'Savings vs Highest', values: marketplaceMetrics.savings, format: (v: string | number) => formatCurrency(Number(v)) },
    ]
    if (highlightDifferencesOnly) {
      return rows.filter(r => new Set(r.values.map(x => String(x ?? ''))).size > 1)
    }
    return rows
  }, [listings, marketplaceMetrics, listingSpecMaps, highlightDifferencesOnly])

  // Export data for PDF (prediction or marketplace)
  const exportData = useMemo(() => {
    if (isMarketplaceComparison && marketplaceMetrics && listings.length >= 2) {
      const best = marketplaceMetrics.bestDealIndex
      return {
        mode: 'marketplace' as const,
        columnLabels: listings.map(l => `${l.make} ${l.model}`),
        specRows: listingSpecRows,
        summary: listings.map((l, i) => ({ name: `${l.make} ${l.model}`, price: l.price, savings: marketplaceMetrics.savings[i] ?? 0 })),
        chartSummary: listingChartData,
        recommendation: `Best value: ${listings[best]?.make} ${listings[best]?.model} at ${formatCurrency(listings[best]?.price ?? 0)}. Save ${formatCurrency(marketplaceMetrics.savings[best] ?? 0)} vs most expensive.`,
      }
    }
    if (!isMarketplaceComparison && comparisonMetrics && specRows.length > 0) {
      return {
        mode: 'prediction' as const,
        columnLabels: cars.map((c, i) => c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`),
        specRows,
        summary: cars.map((c, i) => ({ name: c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`, price: c.prediction?.predicted_price ?? 0, savings: comparisonMetrics.savings[i] ?? 0 })),
        chartSummary: chartData,
        recommendation: comparisonMetrics.recommendation || '',
      }
    }
    return null
  }, [isMarketplaceComparison, marketplaceMetrics, listings, listingSpecRows, listingChartData, comparisonMetrics, specRows, cars, chartData])

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{(t && typeof t === 'function' ? t('title') : null) || 'Compare Cars'}</h1>
          <p className="text-sm md:text-base text-[#94a3b8]">
            {isMarketplaceComparison
              ? 'Compare marketplace listings side by side'
              : (t && typeof t === 'function' ? t('description') : null) || 'Compare multiple cars side by side'
            }
          </p>
        </div>

        {/* Marketplace Comparison View */}
        {isMarketplaceComparison && (
          <>
            {loadingListings ? (
              <div className="space-y-6">
                <ListingCardSkeleton />
                <ListingCardSkeleton />
                <ListingCardSkeleton />
              </div>
            ) : listings.length === 0 ? (
              <Card className="border-[#2a2d3a] bg-[#1a1d29]">
                <CardContent className="py-12 text-center">
                  <p className="text-white/70">No listings found for comparison</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Marketplace: Summary, Chart, Specs, Value, Ownership */}
                {marketplaceMetrics && listings.length >= 2 && (
                  <>
                    <CompareSummaryCards
                      cars={listings.map((l, i) => ({ name: `${l.make} ${l.model}`, price: l.price, index: i }))}
                      bestDealIndex={marketplaceMetrics.bestDealIndex}
                      mostExpensiveIndex={marketplaceMetrics.mostExpensiveIndex}
                      savings={marketplaceMetrics.savings}
                    />
                    <SmartRecommendations
                      cars={listings.map((l, i) => {
                        const fe = listingSpecMaps[i]?.fuelEconomy
                        const avgMpg = fe ? (fe.city + fe.highway) / 2 : 0
                        return {
                          name: `${l.make} ${l.model}`,
                          index: i,
                          price: l.price,
                          horsepower: listingSpecMaps[i]?.horsepower,
                          fuelEconomy: fe ? mpgToL100km(avgMpg) : undefined,
                          savings: marketplaceMetrics.savings[i],
                          reliability: listingSpecMaps[i]?.reliabilityRating,
                        }
                      })}
                      bestDealIndex={marketplaceMetrics.bestDealIndex}
                      savings={marketplaceMetrics.savings}
                      bestForPerformance={listings.reduce((b, _, i) => ((listingSpecMaps[i]?.horsepower ?? 0) > (listingSpecMaps[b]?.horsepower ?? 0) ? i : b), 0)}
                      bestForEconomy={listings.reduce((b, _, i) => { const ea = listingSpecMaps[i]?.fuelEconomy; const eb = listingSpecMaps[b]?.fuelEconomy; const la = ea ? mpgToL100km((ea.city + ea.highway) / 2) : Infinity; const lb = eb ? mpgToL100km((eb.city + eb.highway) / 2) : Infinity; return la < lb ? i : b; }, 0)}
                      bestForReliability={listings.reduce((b, _, i) => ((listingSpecMaps[i]?.reliabilityRating ?? 0) > (listingSpecMaps[b]?.reliabilityRating ?? 0) ? i : b), 0)}
                    />
                    {listingChartData.length > 0 && <ComparisonChart data={listingChartData} />}
                    {listingSpecRows.length > 0 && (
                      <Card className="border-[#2a2d3a] bg-[#1a1d29]/90">
                        <CardHeader>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="text-white">Specifications & Comparison</CardTitle>
                            <div className="flex items-center gap-2">
                              <Switch id="mk-hl-diff" checked={highlightDifferencesOnly} onCheckedChange={v => setHighlightDifferencesOnly(!!v)} />
                              <Label htmlFor="mk-hl-diff" className="text-sm text-[#94a3b8] cursor-pointer">Highlight differences only</Label>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <SpecificationTable
                            columnLabels={listings.map(l => `${l.make} ${l.model}`)}
                            rows={listingSpecRows}
                            bestDealIndex={marketplaceMetrics.bestDealIndex}
                            mostExpensiveIndex={marketplaceMetrics.mostExpensiveIndex}
                            highlightBestInRow
                            showIcons={false}
                          />
                        </CardContent>
                      </Card>
                    )}
                    <ValueAnalysisSection
                      cars={listings.map((l, i) => ({ name: `${l.make} ${l.model}`, price: l.price, horsepower: listingSpecMaps[i]?.horsepower ?? 0, mileage: l.mileage }))}
                      bestDealIndex={marketplaceMetrics.bestDealIndex}
                    />
                    <OwnershipCostsSection
                      cars={listings.map((l, i) => ({
                        name: `${l.make} ${l.model}`,
                        price: l.price,
                        mileage: l.mileage,
                        fuelEconomyCity: listingSpecMaps[i]?.fuelEconomy?.city ?? 25,
                        fuelEconomyHighway: listingSpecMaps[i]?.fuelEconomy?.highway ?? 33,
                        fuelType: l.fuel_type,
                      }))}
                      bestDealIndex={marketplaceMetrics.bestDealIndex}
                    />
                  </>
                )}
                {/* Action Buttons - marketplace */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {marketplaceMetrics && listings.length >= 2 && (
                    <>
                      <ExportPDF
                        data={exportData}
                        onSuccess={() => toast?.toast?.({ title: 'Exported', description: 'PDF saved.' })}
                        onError={(e) => toast?.toast?.({ title: 'Export failed', description: e.message, variant: 'destructive' })}
                        variant="outline"
                        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                      />
                      <ShareComparison
                        mode="marketplace"
                        ids={listings.map(l => l.id)}
                        onCopy={() => toast?.toast?.({ title: 'Link copied', description: 'Comparison link copied to clipboard.' })}
                        variant="outline"
                        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                      />
                      <CompareSaveAndHistory
                        canSave={listings.length >= 2}
                        onSave={handleSaveCompare}
                        onLoad={handleLoadCompare}
                        variant="outline"
                        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                      />
                    </>
                  )}
                  <Button
                    onClick={() => { if (typeof window !== 'undefined') window.print() }}
                    variant="outline"
                    className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                  >
                    <Download className="me-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Prediction Comparison View (existing code) */}
        {!isMarketplaceComparison && (
          <>
            {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3 justify-between items-center">
            <Button
              onClick={() => {
                try {
                  addCar()
                } catch (error) {
                  console.error('Error adding car:', error)
                }
              }}
              variant="outline"
              className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {(t && typeof t === 'function' ? t('addCar') : null) || 'Add Car'}
            </Button>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                try {
                  predictAll()
                } catch (error) {
                  console.error('Error predicting all:', error)
                  if (toast?.toast) {
                    toast.toast({
                      title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
                      description: 'Failed to predict all cars',
                      variant: 'destructive',
                    })
                  }
                }
              }}
              className="bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white"
              disabled={cars.every(c => !c.features || c.prediction) || predictingAll}
            >
              {predictingAll ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Predicting All...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {(t && typeof t === 'function' ? t('predictAll') : null) || 'Predict All'}
                </>
              )}
            </Button>
            {allCarsHavePredictions && hasMultipleCars && (
              <>
                <ExportPDF
                  data={exportData}
                  onSuccess={() => toast?.toast?.({ title: 'Exported', description: 'PDF saved.' })}
                  onError={(e) => toast?.toast?.({ title: 'Export failed', description: e.message, variant: 'destructive' })}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                />
                <ShareComparison
                  mode="prediction"
                  predictionState={{ cars: cars.map(c => ({ features: c.features, prediction: c.prediction })) }}
                  onCopy={() => toast?.toast?.({ title: 'Link copied', description: 'Comparison link copied to clipboard.' })}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                />
                <CompareSaveAndHistory
                  canSave={allCarsHavePredictions && hasMultipleCars}
                  onSave={handleSaveCompare}
                  onLoad={handleLoadCompare}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                />
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <AnimatePresence>
          {allCarsHavePredictions && hasMultipleCars && comparisonMetrics && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
              <CompareSummaryCards
                cars={cars.map((c, i) => ({ name: c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`, price: c.prediction?.predicted_price || 0, index: i }))}
                bestDealIndex={comparisonMetrics.bestDealIndex}
                mostExpensiveIndex={comparisonMetrics.mostExpensiveIndex}
                savings={comparisonMetrics.savings}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Recommendations */}
        <AnimatePresence>
          {allCarsHavePredictions && hasMultipleCars && comparisonMetrics && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
              <SmartRecommendations
                cars={cars.map((c, i) => {
                  const fe = specMaps[i]?.fuelEconomy
                  const avgMpg = fe ? (fe.city + fe.highway) / 2 : 0
                  return {
                    name: c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`,
                    index: i,
                    price: c.prediction?.predicted_price || 0,
                    horsepower: specMaps[i]?.horsepower,
                    fuelEconomy: fe ? mpgToL100km(avgMpg) : undefined,
                    savings: comparisonMetrics.savings[i],
                    reliability: specMaps[i]?.reliabilityRating,
                  }
                })}
                bestDealIndex={comparisonMetrics.bestDealIndex}
                savings={comparisonMetrics.savings}
                bestForPerformance={cars.reduce((best, c, i) => ((specMaps[i]?.horsepower ?? 0) > (specMaps[best]?.horsepower ?? 0) ? i : best), 0)}
                bestForEconomy={cars.reduce((best, c, i) => { const ea = specMaps[i]?.fuelEconomy; const eb = specMaps[best]?.fuelEconomy; const la = ea ? mpgToL100km((ea.city + ea.highway) / 2) : Infinity; const lb = eb ? mpgToL100km((eb.city + eb.highway) / 2) : Infinity; return la < lb ? i : best; }, 0)}
                bestForReliability={cars.reduce((best, c, i) => ((specMaps[i]?.reliabilityRating ?? 0) > (specMaps[best]?.reliabilityRating ?? 0) ? i : best), 0)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Charts (Price / Performance / Radar) */}
        <AnimatePresence>
          {chartData.length > 0 && hasMultipleCars && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mb-6">
              <ComparisonChart data={chartData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Specifications &amp; Comparison Table */}
        <AnimatePresence>
          {allCarsHavePredictions && hasMultipleCars && comparisonMetrics && specRows.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 space-y-6">
              <Card className="border-[#2a2d3a] bg-[#1a1d29]/90 backdrop-blur-sm overflow-visible">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-white">Specifications & Comparison</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch id="highlight-diff" checked={highlightDifferencesOnly} onCheckedChange={v => setHighlightDifferencesOnly(!!v)} />
                      <Label htmlFor="highlight-diff" className="text-sm text-[#94a3b8] cursor-pointer">Highlight differences only</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SpecificationTable
                    columnLabels={cars.map((c, i) => c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`)}
                    rows={specRows}
                    bestDealIndex={comparisonMetrics.bestDealIndex}
                    mostExpensiveIndex={comparisonMetrics.mostExpensiveIndex}
                    highlightBestInRow
                    showIcons
                  />
                </CardContent>
              </Card>

              <ValueAnalysisSection
                cars={cars.map((c, i) => ({
                  name: c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`,
                  price: c.prediction?.predicted_price || 0,
                  horsepower: specMaps[i]?.horsepower ?? 0,
                  mileage: c.features?.mileage ?? 0,
                }))}
                bestDealIndex={comparisonMetrics.bestDealIndex}
              />

              <OwnershipCostsSection
                cars={cars.map((c, i) => ({
                  name: c.features ? `${c.features.make} ${c.features.model}` : `Car ${i + 1}`,
                  price: c.prediction?.predicted_price || 0,
                  mileage: c.features?.mileage ?? 0,
                  fuelEconomyCity: specMaps[i]?.fuelEconomy?.city ?? 25,
                  fuelEconomyHighway: specMaps[i]?.fuelEconomy?.highway ?? 33,
                  fuelType: c.features?.fuel_type,
                }))}
                bestDealIndex={comparisonMetrics.bestDealIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>


        {/* Car Cards Grid */}
        <motion.div
          layout
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {cars.map((car, index) => {
              const isBestDeal = comparisonMetrics?.bestDealIndex === index
              const isMostExpensive = comparisonMetrics?.mostExpensiveIndex === index

              return (
                <motion.div
                  key={car.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    className={`border-[#2a2d3a] bg-[#1a1d29] hover:border-[#5B7FFF]/50 transition-all duration-300 hover:shadow-lg ${
                      isBestDeal && allCarsHavePredictions
                        ? 'border-green-500 border-2 shadow-green-500/25 shadow-lg'
                        : isMostExpensive && allCarsHavePredictions
                        ? 'border-red-500 border-2'
                        : 'hover:shadow-[#5B7FFF]/20'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-white text-lg font-bold">
                            Car {index + 1}
                          </CardTitle>
                          {isBestDeal && allCarsHavePredictions && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-semibold rounded flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              Best Deal
                            </span>
                          )}
                        </div>
                        {cars.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCar(car.id)}
                            className="h-7 w-7 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {car.prediction && (
                        <div className="mt-2">
                          <span className="text-sm text-[#5B7FFF] font-normal">
                            {formatCurrency(car.prediction.predicted_price)}
                          </span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <PredictionForm
                        onSubmit={(features) => {
                          try {
                            handlePredict(car.id, features)
                          } catch (error) {
                            console.error('Error in prediction form:', error)
                          }
                        }}
                        loading={car.loading || false}
                        hideVehicleType
                      />
                      {car.prediction && car.features && (
                        <div className="mt-4 pt-4 border-t border-[#2a2d3a] space-y-3">
                          <div className="p-3 bg-gradient-to-br from-[#5B7FFF]/10 to-[#1a1d29] rounded-lg border border-[#5B7FFF]/20">
                            <div className="text-xs text-[#94a3b8] mb-1">Predicted Price</div>
                            <div className="text-2xl font-bold text-[#5B7FFF]">
                              {formatCurrency(car.prediction.predicted_price)}
                            </div>
                            {car.prediction.confidence_range && (
                              <div className="text-xs text-[#94a3b8] mt-1">
                                Confidence: {car.prediction.confidence_range}%
                              </div>
                            )}
                          </div>
                          {car.prediction.deal_analysis && (
                            <div className="text-xs text-[#94a3b8]">
                              <p className="capitalize">
                                <span className="font-semibold">Deal Rating:</span> {car.prediction.deal_analysis}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
