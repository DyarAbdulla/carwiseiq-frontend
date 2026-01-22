"use client"


export const runtime = 'edge';
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PredictionForm } from '@/components/prediction/PredictionForm'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { X, Plus, Download, Share2, Save, Trophy, TrendingDown, TrendingUp, Sparkles, Check, X as XIcon } from 'lucide-react'
import type { CarFeatures, PredictionResponse } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Image from 'next/image'
import { ListingCardSkeleton } from '@/components/common/LoadingSkeleton'

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

function ComparePageContent() {
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

  // ALL hooks must be called unconditionally BEFORE any conditional returns
  const t = useTranslations('compare')
  const tCommon = useTranslations('common')
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load marketplace listings if IDs provided
  useEffect(() => {
    if (isMarketplaceComparison && listingIds.length > 0) {
      loadListings()
    }
  }, [isMarketplaceComparison, listingIds.join(',')])

  const loadListings = async () => {
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
  }

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

  // Generate chart data - MUST be before conditional return
  const chartData = useMemo(() => {
    if (!comparisonMetrics) return []
    return cars.map((car, index) => ({
      name: `Car ${index + 1}`,
      price: car.prediction?.predicted_price || 0,
      fullName: `${car.features?.make} ${car.features?.model}`,
      isBestDeal: index === comparisonMetrics.bestDealIndex,
      isMostExpensive: index === comparisonMetrics.mostExpensiveIndex,
    }))
  }, [cars, comparisonMetrics])

  const addCar = () => {
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

  // Export comparison as PDF
  const handleExportPDF = async () => {
    if (!allCarsHavePredictions) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Please predict all cars before exporting',
          variant: 'destructive',
        })
      }
      return
    }

    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF export is only available in the browser')
      }
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF()

      // Title
      doc.setFontSize(20)
      doc.text('Car Comparison Report', 14, 20)
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

      let yPos = 40
      cars.forEach((car, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(14)
        doc.text(`Car ${index + 1}: ${car.features?.make} ${car.features?.model}`, 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.text(`Year: ${car.features?.year}`, 14, yPos)
        yPos += 6
        doc.text(`Mileage: ${car.features?.mileage?.toLocaleString()} km`, 14, yPos)
        yPos += 6
        doc.text(`Condition: ${car.features?.condition}`, 14, yPos)
        yPos += 6
        doc.text(`Predicted Price: ${formatCurrency(car.prediction?.predicted_price || 0)}`, 14, yPos)
        yPos += 6
        if (car.prediction?.confidence_range) {
          doc.text(`Confidence: ${car.prediction.confidence_range}%`, 14, yPos)
          yPos += 6
        }
        yPos += 5
      })

      if (comparisonMetrics) {
        yPos += 5
        doc.setFontSize(14)
        doc.text('Recommendation', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        const splitText = doc.splitTextToSize(comparisonMetrics.recommendation.replace(/\*\*/g, ''), 180)
        doc.text(splitText, 14, yPos)
      }

      doc.save('car-comparison.pdf')

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Comparison exported as PDF',
        })
      }
    } catch (error: any) {
      console.error('PDF export error:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to export PDF',
          variant: 'destructive',
        })
      }
    }
  }

  // Share comparison link
  const handleShare = async () => {
    if (!allCarsHavePredictions) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Please predict all cars before sharing',
          variant: 'destructive',
        })
      }
      return
    }

    try {
      if (typeof window === 'undefined' || !navigator?.clipboard) {
        throw new Error('Clipboard API not available')
      }

      const comparisonData = {
        cars: cars.map(c => ({
          features: c.features || null,
          prediction: c.prediction ? {
            predicted_price: c.prediction.predicted_price || 0,
            confidence_range: c.prediction.confidence_range || 0,
          } : null,
        })),
        timestamp: Date.now(),
      }

      // For now, copy to clipboard as JSON (could be enhanced with a shareable link API)
      await navigator.clipboard.writeText(JSON.stringify(comparisonData, null, 2))

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Comparison data copied to clipboard',
        })
      }
    } catch (error: any) {
      console.error('Share error:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to share comparison',
          variant: 'destructive',
        })
      }
    }
  }

  // Save comparison (placeholder - would integrate with user dashboard API)
  const handleSaveComparison = async () => {
    if (!allCarsHavePredictions) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Please predict all cars before saving',
          variant: 'destructive',
        })
      }
      return
    }

    // TODO: Implement API call to save comparison to user dashboard
    if (toast?.toast) {
      toast.toast({
        title: 'Coming Soon',
        description: 'Save comparison feature will be available soon',
      })
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
                {/* Comparison Table */}
                <Card className="border-[#2a2d3a] bg-[#1a1d29]">
                  <CardHeader>
                    <CardTitle className="text-white">Side-by-Side Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="w-full text-sm min-w-full">
                        <thead>
                          <tr className="border-b border-[#2a2d3a]">
                            <th className="text-left p-3 text-[#94a3b8] font-semibold">Feature</th>
                            {listings.map((listing, idx) => (
                              <th
                                key={listing.id}
                                className={`text-center p-3 text-white font-semibold relative ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/10 border-l-2 border-r-2 border-green-500'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/10 border-l-2 border-r-2 border-red-500'
                                    : ''
                                }`}
                              >
                                {listing.make} {listing.model}
                                {listing.id === marketplaceMetrics?.winnerId && (
                                  <span className="absolute top-1 right-1">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-white">
                          {/* Images */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Image</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                <div className="relative h-32 w-full bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20 rounded-lg overflow-hidden">
                                  {listing.image_url ? (
                                    <Image
                                      src={listing.image_url}
                                      alt={`${listing.make} ${listing.model} ${listing.year}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/50" aria-label={`${listing.make} ${listing.model}`}>
                                      No Image
                                    </div>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>

                          {/* Year */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Year</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.year}
                              </td>
                            ))}
                          </tr>

                          {/* Price */}
                          <tr className="border-b border-[#2a2d3a] bg-[#5B7FFF]/10">
                            <td className="p-3 text-[#5B7FFF] font-bold">Price</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/10'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/10'
                                    : ''
                                }`}
                              >
                                <span className="text-[#5B7FFF] font-bold text-lg">
                                  {formatCurrency(listing.price)}
                                </span>
                                {idx === marketplaceMetrics?.bestDealIndex && (
                                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-500 text-xs font-semibold rounded">
                                    Best Deal
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>

                          {/* Mileage */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Mileage</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.mileage.toLocaleString()} km
                              </td>
                            ))}
                          </tr>

                          {/* Condition */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Condition</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.condition}
                              </td>
                            ))}
                          </tr>

                          {/* Fuel Type */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Fuel Type</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.fuel_type}
                              </td>
                            ))}
                          </tr>

                          {/* Transmission */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Transmission</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.transmission}
                              </td>
                            ))}
                          </tr>

                          {/* Color */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Color</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.color}
                              </td>
                            ))}
                          </tr>

                          {/* Location */}
                          <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Location</td>
                            {listings.map((listing, idx) => (
                              <td
                                key={listing.id}
                                className={`p-3 text-center ${
                                  idx === marketplaceMetrics?.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === marketplaceMetrics?.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                {listing.location_city || 'N/A'}
                              </td>
                            ))}
                          </tr>

                          {/* Features Checklist */}
                          {allFeatures.length > 0 && (
                            <>
                              {allFeatures.map(feature => (
                                <tr key={feature} className="border-b border-[#2a2d3a]">
                                  <td className="p-3 text-[#94a3b8] font-medium">{feature}</td>
                                  {listings.map((listing, idx) => (
                                    <td
                                      key={listing.id}
                                      className={`p-3 text-center ${
                                        idx === marketplaceMetrics?.bestDealIndex
                                          ? 'bg-green-500/5'
                                          : idx === marketplaceMetrics?.mostExpensiveIndex
                                          ? 'bg-red-500/5'
                                          : ''
                                      }`}
                                    >
                                      {listing.features.includes(feature) ? (
                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                      ) : (
                                        <XIcon className="h-5 w-5 text-red-500 mx-auto" />
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </>
                          )}

                          {/* Price Difference */}
                          <tr className="border-b border-[#2a2d3a] bg-[#2a2d3a]/30">
                            <td className="p-3 text-[#94a3b8] font-medium">Price Difference vs Average</td>
                            {listings.map((listing, idx) => {
                              const diff = listing.price - (marketplaceMetrics?.avgPrice || 0)
                              const isCheaper = diff < 0
                              return (
                                <td
                                  key={listing.id}
                                  className={`p-3 text-center ${
                                    idx === marketplaceMetrics?.bestDealIndex
                                      ? 'bg-green-500/5'
                                      : idx === marketplaceMetrics?.mostExpensiveIndex
                                      ? 'bg-red-500/5'
                                      : ''
                                  }`}
                                >
                                  <span className={`flex items-center justify-center gap-1 ${
                                    isCheaper ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-[#94a3b8]'
                                  }`}>
                                    {Math.abs(diff) > 1 && (
                                      <>
                                        {isCheaper ? (
                                          <TrendingDown className="h-4 w-4" />
                                        ) : (
                                          <TrendingUp className="h-4 w-4" />
                                        )}
                                        {formatCurrency(Math.abs(diff))}
                                        {isCheaper ? ' below avg' : ' above avg'}
                                      </>
                                    )}
                                    {Math.abs(diff) <= 1 && (
                                      <span className="text-[#94a3b8]">≈ Average</span>
                                    )}
                                  </span>
                                </td>
                              )
                            })}
                          </tr>

                          {/* Savings */}
                          <tr className="border-t-2 border-[#5B7FFF] bg-[#5B7FFF]/5">
                            <td className="p-3 text-[#5B7FFF] font-bold">Savings vs Most Expensive</td>
                            {listings.map((listing, idx) => {
                              const savings = marketplaceMetrics?.savings[idx] || 0
                              const isMostExpensive = idx === marketplaceMetrics?.mostExpensiveIndex
                              return (
                                <td
                                  key={listing.id}
                                  className={`p-3 text-center ${
                                    idx === marketplaceMetrics?.bestDealIndex
                                      ? 'bg-green-500/10'
                                      : isMostExpensive
                                      ? 'bg-red-500/10'
                                      : ''
                                  }`}
                                >
                                  {isMostExpensive ? (
                                    <span className="text-[#94a3b8]">—</span>
                                  ) : (
                                    <span className="text-green-500 font-bold">
                                      Save {formatCurrency(savings)}
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={async () => {
                      try {
                        if (typeof window === 'undefined') return
                        const url = window.location.href
                        await navigator.clipboard.writeText(url)
                        if (toast?.toast) {
                          toast.toast({
                            title: 'Link copied',
                            description: 'Comparison link copied to clipboard',
                          })
                        }
                      } catch (error) {
                        console.error('Failed to copy:', error)
                      }
                    }}
                    variant="outline"
                    className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Comparison
                  </Button>
                  <Button
                    onClick={() => {
                      if (typeof window === 'undefined') return
                      window.print()
                    }}
                    variant="outline"
                    className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
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
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  onClick={handleSaveComparison}
                  variant="outline"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Recommendation Section */}
        <AnimatePresence>
          {comparisonMetrics && comparisonMetrics.recommendation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-[#5B7FFF] bg-gradient-to-br from-[#5B7FFF]/10 to-[#1a1d29] mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#5B7FFF]" />
                    <CardTitle className="text-white">AI Recommendation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-[#94a3b8] whitespace-pre-line">
                      {comparisonMetrics.recommendation.replace(/\*\*/g, '')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price Comparison Chart */}
        <AnimatePresence>
          {chartData.length > 0 && hasMultipleCars && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Price Comparison Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1d29',
                          border: '1px solid #2a2d3a',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          formatCurrency(value),
                          props.payload.fullName,
                        ]}
                      />
                      <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.isBestDeal
                                ? '#10B981'
                                : entry.isMostExpensive
                                ? '#EF4444'
                                : '#5B7FFF'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Table View (when all cars have predictions) */}
        <AnimatePresence>
          {allCarsHavePredictions && hasMultipleCars && comparisonMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6 hover:border-[#5B7FFF]/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Side-by-Side Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-sm min-w-full">
                      <thead>
                        <tr className="border-b border-[#2a2d3a]">
                          <th className="text-left p-3 text-[#94a3b8] font-semibold">Feature</th>
                          {cars.map((car, idx) => (
                            <th
                              key={car.id}
                              className={`text-center p-3 text-white font-semibold relative ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/10 border-l-2 border-r-2 border-green-500'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/10 border-l-2 border-r-2 border-red-500'
                                  : ''
                              }`}
                            >
                              Car {idx + 1}
                              {idx === comparisonMetrics.bestDealIndex && (
                                <span className="absolute top-1 right-1">
                                  <Trophy className="h-4 w-4 text-green-500" />
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-white">
                        <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Make & Model</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.features?.make || 'N/A'} {car.features?.model || ''}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Year</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.features?.year || 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Mileage (km)</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.features?.mileage ? car.features.mileage.toLocaleString() : 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Condition</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.features?.condition || 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-[#2a2d3a]">
                            <td className="p-3 text-[#94a3b8] font-medium">Fuel Type</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.features?.fuel_type || 'N/A'}
                            </td>
                          ))}
                        </tr>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="border-b border-[#2a2d3a] bg-[#5B7FFF]/10"
                        >
                          <td className="p-3 text-[#5B7FFF] font-bold">Predicted Price</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/10'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/10'
                                  : ''
                              }`}
                            >
                              <span className="text-[#5B7FFF] font-bold text-lg">
                                {formatCurrency(car.prediction?.predicted_price || 0)}
                              </span>
                              {idx === comparisonMetrics.bestDealIndex && (
                                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-500 text-xs font-semibold rounded">
                                  Best Deal
                                </span>
                              )}
                            </td>
                          ))}
                        </motion.tr>
                        {/* Confidence % Row */}
                        <tr className="border-b border-[#2a2d3a]">
                          <td className="p-3 text-[#94a3b8] font-medium">Confidence</td>
                          {cars.map((car, idx) => (
                            <td
                              key={car.id}
                              className={`p-3 text-center ${
                                idx === comparisonMetrics.bestDealIndex
                                  ? 'bg-green-500/5'
                                  : idx === comparisonMetrics.mostExpensiveIndex
                                  ? 'bg-red-500/5'
                                  : ''
                              }`}
                            >
                              {car.prediction?.confidence_range ? (
                                <span className={`font-medium ${
                                  (car.prediction.confidence_range || 0) >= 80 ? 'text-green-500' :
                                  (car.prediction.confidence_range || 0) >= 60 ? 'text-yellow-500' :
                                  'text-red-500'
                                }`}>
                                  {car.prediction.confidence_range}%
                                </span>
                              ) : (
                                <span className="text-[#94a3b8]">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        {/* Price Difference Row */}
                        <tr className="border-b border-[#2a2d3a] bg-[#2a2d3a]/30">
                          <td className="p-3 text-[#94a3b8] font-medium">Price Difference vs Average</td>
                          {cars.map((car, idx) => {
                            const allPrices = cars.map(c => c.prediction?.predicted_price || 0)
                            const avgPrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
                            const diff = (car.prediction?.predicted_price || 0) - avgPrice
                            const isCheaper = diff < 0

                            return (
                              <td
                                key={car.id}
                                className={`p-3 text-center ${
                                  idx === comparisonMetrics.bestDealIndex
                                    ? 'bg-green-500/5'
                                    : idx === comparisonMetrics.mostExpensiveIndex
                                    ? 'bg-red-500/5'
                                    : ''
                                }`}
                              >
                                <span className={`flex items-center justify-center gap-1 ${
                                  isCheaper ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-[#94a3b8]'
                                }`}>
                                  {Math.abs(diff) > 1 && (
                                    <>
                                      {isCheaper ? (
                                        <TrendingDown className="h-4 w-4" />
                                      ) : (
                                        <TrendingUp className="h-4 w-4" />
                                      )}
                                      {formatCurrency(Math.abs(diff))}
                                      {isCheaper ? ' below avg' : ' above avg'}
                                    </>
                                  )}
                                  {Math.abs(diff) <= 1 && (
                                    <span className="text-[#94a3b8]">≈ Average</span>
                                  )}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                        {/* Total Savings Row */}
                        <tr className="border-t-2 border-[#5B7FFF] bg-[#5B7FFF]/5">
                          <td className="p-3 text-[#5B7FFF] font-bold">Savings vs Most Expensive</td>
                          {cars.map((car, idx) => {
                            const savings = comparisonMetrics.savings[idx]
                            const isBestDeal = idx === comparisonMetrics.bestDealIndex
                            const isMostExpensive = idx === comparisonMetrics.mostExpensiveIndex

                            return (
                              <td
                                key={car.id}
                                className={`p-3 text-center ${
                                  isBestDeal
                                    ? 'bg-green-500/10'
                                    : isMostExpensive
                                    ? 'bg-red-500/10'
                                    : ''
                                }`}
                              >
                                {isMostExpensive ? (
                                  <span className="text-[#94a3b8]">—</span>
                                ) : (
                                  <span className="text-green-500 font-bold">
                                    Save {formatCurrency(savings)}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
                    className={`border-[#2a2d3a] bg-[#1a1d29] hover:border-[#5B7FFF]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#5B7FFF]/20 ${
                      isBestDeal && allCarsHavePredictions
                        ? 'border-green-500 border-2'
                        : isMostExpensive && allCarsHavePredictions
                        ? 'border-red-500 border-2'
                        : ''
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

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading compare page...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}
