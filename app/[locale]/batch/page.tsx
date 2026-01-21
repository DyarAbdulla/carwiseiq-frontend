"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileSpreadsheet, Download, X, FileDown, ArrowUpDown, ArrowUp, ArrowDown, Link as LinkIcon, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { CarFeatures, BatchPredictionResult } from '@/lib/types'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'
import { detectPlatform, isValidUrl, isCarListingUrl } from '@/utils/platformDetection'
import { PlatformBadge } from '@/components/batch/PlatformBadge'
import { LoadingStages } from '@/components/batch/LoadingStages'
import { UrlResultCard } from '@/components/batch/UrlResultCard'
import { StatsDashboard } from '@/components/batch/StatsDashboard'
import { FilterPanel } from '@/components/batch/FilterPanel'
import { DealQualityTooltip } from '@/components/batch/DealQualityTooltip'
import { ConfidenceBreakdown } from '@/components/batch/ConfidenceBreakdown'
import { BulkUrlProcessor } from '@/components/batch/BulkUrlProcessor'
import { ExportOptions } from '@/components/batch/ExportOptions'
import { CompareMode } from '@/components/batch/CompareMode'
import { MobileCardView } from '@/components/batch/MobileCardView'
import { PriceAlertManager } from '@/components/batch/PriceAlertManager'
import { ErrorDisplay, createError } from '@/components/batch/ErrorDisplay'
import { useFavorites } from '@/hooks/useFavorites'
import { Checkbox } from '@/components/ui/checkbox'

type SortField = 'make' | 'model' | 'year' | 'mileage' | 'condition' | 'predicted_price' | 'confidence' | 'deal_rating'
type SortDirection = 'asc' | 'desc' | null

interface ExtendedResult extends BatchPredictionResult {
  confidence_percent?: number
  price_range?: { min: number; max: number }
  deal_rating?: 'Good' | 'Fair' | 'Poor'
}

export default function BatchPage() {
  // All hooks must be called before any conditional returns
  const [mounted, setMounted] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<BatchPredictionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentProcessing, setCurrentProcessing] = useState({ current: 0, total: 0 })
  const [dragActive, setDragActive] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [urlInput, setUrlInput] = useState('')
  const [filteredResults, setFilteredResults] = useState<ExtendedResult[]>([])
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [urlLoading, setUrlLoading] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState<ReturnType<typeof detectPlatform>>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<number>>(new Set())
  const [error, setError] = useState<ReturnType<typeof createError> | null>(null)
  const statsDashboardRef = useRef<HTMLDivElement>(null)
  const favorites = useFavorites()
  const [isMobile, setIsMobile] = useState(false)
  const [urlResult, setUrlResult] = useState<{
    extracted_data: CarFeatures
    predicted_price: number
    listing_price?: number
    price_comparison?: {
      listing_price: number
      predicted_price: number
      difference: number
      difference_percent: number
      is_above_market: boolean
      is_below_market: boolean
    }
    confidence_interval?: {
      lower: number
      upper: number
    }
    message?: string
    listing_url?: string
    car_image?: string
  } | null>(null)

  // All hooks must be called unconditionally
  const t = useTranslations('batch')
  const tCommon = useTranslations('common')
    const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Platform detection when URL changes
  useEffect(() => {
    if (urlInput && urlInput.trim()) {
      const platform = detectPlatform(urlInput)
      setDetectedPlatform(platform)
    } else {
      setDetectedPlatform(null)
    }
  }, [urlInput])

  // Enhanced results with computed fields - MUST be before conditional return
  const enhancedResults: ExtendedResult[] = useMemo(() => {
    if (results.length === 0) return []

    const avgPrice = results.reduce((sum, r) => sum + (r.predicted_price || 0), 0) / results.length

    return results.map((result) => {
      const confidencePercent = result.confidence_interval
        ? Math.round((1 - (result.confidence_interval.upper - result.confidence_interval.lower) / result.predicted_price) * 100)
        : undefined

      const priceRange = result.confidence_interval
        ? { min: result.confidence_interval.lower, max: result.confidence_interval.upper }
        : undefined

      // Determine deal rating based on price relative to average
      let dealRating: 'Good' | 'Fair' | 'Poor' = 'Fair'
      if (result.predicted_price > 0 && avgPrice > 0) {
        const priceRatio = result.predicted_price / avgPrice
        if (priceRatio < 0.85) dealRating = 'Good'
        else if (priceRatio > 1.15) dealRating = 'Poor'
        else dealRating = 'Fair'
      }

      return {
        ...result,
        confidence_percent: confidencePercent,
        price_range: priceRange,
        deal_rating: dealRating,
      }
    })
  }, [results])

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Update filtered results when enhanced results change
  useEffect(() => {
    setFilteredResults(enhancedResults)
  }, [enhancedResults])

  const sortedResults = useMemo(() => {
    const resultsToSort = filteredResults.length > 0 ? filteredResults : enhancedResults
    if (!sortField || !sortDirection) return resultsToSort

    return [...resultsToSort].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'make':
          aVal = a.car.make
          bVal = b.car.make
          break
        case 'model':
          aVal = a.car.model
          bVal = b.car.model
          break
        case 'year':
          aVal = a.car.year
          bVal = b.car.year
          break
        case 'mileage':
          aVal = a.car.mileage
          bVal = b.car.mileage
          break
        case 'condition':
          aVal = a.car.condition
          bVal = b.car.condition
          break
        case 'predicted_price':
          aVal = a.predicted_price
          bVal = b.predicted_price
          break
        case 'confidence':
          aVal = a.confidence_percent ?? 0
          bVal = b.confidence_percent ?? 0
          break
        case 'deal_rating':
          const ratingOrder = { 'Good': 1, 'Fair': 2, 'Poor': 3 }
          aVal = ratingOrder[a.deal_rating ?? 'Fair']
          bVal = ratingOrder[b.deal_rating ?? 'Fair']
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredResults, enhancedResults, sortField, sortDirection])

  // Summary stats
  const summaryStats = useMemo(() => {
    if (sortedResults.length === 0) return null

    const successful = sortedResults.filter(r => !r.error)
    const avgPrice = successful.length > 0
      ? successful.reduce((sum, r) => sum + r.predicted_price, 0) / successful.length
      : 0

    const bestDeal = sortedResults
      .filter(r => !r.error && r.deal_rating === 'Good')
      .sort((a, b) => a.predicted_price - b.predicted_price)[0]

    const highestValue = sortedResults
      .filter(r => !r.error)
      .sort((a, b) => b.predicted_price - a.predicted_price)[0]

    return {
      total: sortedResults.length,
      successful: successful.length,
      failed: sortedResults.filter(r => r.error).length,
      averagePrice: avgPrice,
      bestDeal: bestDeal ? `${bestDeal.car.make} ${bestDeal.car.model}` : 'N/A',
      highestValue: highestValue ? `${highestValue.car.make} ${highestValue.car.model}` : 'N/A',
    }
  }, [sortedResults])

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  // Download sample CSV
  const handleDownloadSample = () => {
    if (typeof window === 'undefined') return

    try {
      const sampleData = [
        {
          year: '2020',
          mileage: '30000',
          engine_size: '2.5',
          cylinders: '4',
          make: 'Toyota',
          model: 'Camry',
          condition: 'Good',
          fuel_type: 'Gasoline',
          location: 'California'
        },
        {
          year: '2019',
          mileage: '45000',
          engine_size: '3.5',
          cylinders: '6',
          make: 'Honda',
          model: 'Accord',
          condition: 'Excellent',
          fuel_type: 'Gasoline',
          location: 'New York'
        },
        {
          year: '2021',
          mileage: '15000',
          engine_size: '2.0',
          cylinders: '4',
          make: 'Ford',
          model: 'Fusion',
          condition: 'Very Good',
          fuel_type: 'Hybrid',
          location: 'Texas'
        }
      ]

      const csv = Papa.unparse(sampleData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'sample_batch_cars.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      if (toast?.toast) {
        toast.toast({
          title: tCommon('success'),
          description: 'Sample CSV downloaded successfully',
        })
      }
    } catch (error) {
      console.error('Error downloading sample CSV:', error)
      if (toast?.toast) {
        toast.toast({
          title: tCommon('error') || 'Error',
          description: 'Failed to download sample CSV',
          variant: 'destructive',
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e?.target?.files && e.target.files[0]) {
        const selectedFile = e.target.files[0]
        validateAndSetFile(selectedFile)
      }
    } catch (error) {
      console.error('Error handling file change:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Failed to process file',
          variant: 'destructive',
        })
      }
    }
  }

  const validateAndSetFile = (selectedFile: File | null | undefined) => {
    try {
      if (!selectedFile) {
        if (toast?.toast) {
          toast.toast({
            title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
            description: 'No file selected',
            variant: 'destructive',
          })
        }
        return
      }

      // Validate file type
      if (!selectedFile.name || !selectedFile.name.endsWith('.csv')) {
        if (toast?.toast) {
          toast.toast({
            title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
            description: 'Please upload a CSV file',
            variant: 'destructive',
          })
        }
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        if (toast?.toast) {
          toast.toast({
            title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
            description: 'File size must be less than 5MB',
            variant: 'destructive',
          })
        }
        return
      }

      setFile(selectedFile)
    } catch (error) {
      console.error('Error validating file:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Failed to validate file',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    try {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e?.dataTransfer?.files && e.dataTransfer.files[0]) {
        validateAndSetFile(e.dataTransfer.files[0])
      }
    } catch (error) {
      console.error('Error handling file drop:', error)
      setDragActive(false)
    }
  }

  const handleProcess = async () => {
    if (!file) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Please select a CSV file',
          variant: 'destructive',
        })
      }
      return
    }

    setLoading(true)
    setResults([])
    setProgress(0)
    setCurrentProcessing({ current: 0, total: 0 })

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        setProgress(25)

        // Parse the string content instead of File object
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: async (parseResults) => {
            // Set preview (first 5 rows)
            setCsvPreview(parseResults.data.slice(0, 5))
            setProgress(50)

          // Validate row count (max 1000)
          if (parseResults.data.length > 1000) {
            if (toast?.toast) {
              toast.toast({
                title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
                description: 'Maximum 1000 rows allowed. Please split your file.',
                variant: 'destructive',
              })
            }
            setLoading(false)
            setProgress(0)
            setCurrentProcessing({ current: 0, total: 0 })
            return
          }

          const allRows = parseResults.data as any[]
          const validRows = allRows.filter((row: any) => {
            return !!(row.year && row.make && row.model)
          })

          const cars: CarFeatures[] = validRows.map((row: any) => ({
              year: parseInt(row.year),
              mileage: parseFloat(row.mileage) || 0,
              engine_size: parseFloat(row.engine_size) || 2.5,
              cylinders: parseInt(row.cylinders) || 4,
              make: row.make,
              model: row.model,
              condition: row.condition || 'Good',
              fuel_type: row.fuel_type || 'Gasoline',
              location: row.location || 'Unknown',
            }))

          if (cars.length === 0) {
            if (toast?.toast) {
              toast.toast({
                title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
                description: 'No valid car data found in CSV. Please check required columns: year, make, model',
                variant: 'destructive',
              })
            }
            setLoading(false)
            setProgress(0)
            setCurrentProcessing({ current: 0, total: 0 })
            return
          }

          setProgress(60)
          setCurrentProcessing({ current: 0, total: cars.length })

          try {
            const response = await apiClient.predictBatch(cars)
            setProgress(100)
            setCurrentProcessing({ current: cars.length, total: cars.length })
            setResults(response)

            if (toast?.toast) {
              toast.toast({
                title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
                description: `Processed ${response.length} cars successfully`,
              })
            }
          } catch (error: any) {
            console.error('❌ [Batch] Batch prediction failed:', error)
            if (toast?.toast) {
              toast.toast({
                title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
                description: error?.message || 'Failed to process batch',
                variant: 'destructive',
              })
            }
            setLoading(false)
            setProgress(0)
            setCurrentProcessing({ current: 0, total: 0 })
          }
        },
        error: (error: Error) => {
          console.error('❌ [Batch] Papa Parse error:', error)
          if (toast?.toast) {
            toast.toast({
              title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
              description: `CSV parsing error: ${error?.message || 'Unknown error'}`,
              variant: 'destructive',
            })
          }
          setLoading(false)
          setProgress(0)
          setCurrentProcessing({ current: 0, total: 0 })
        },
      })
      }

      // Read file as text
      reader.readAsText(file)
    } catch (error: any) {
      console.error('❌ [Batch] Error processing batch:', error)
      console.error('❌ [Batch] Error message:', error?.message)
      console.error('❌ [Batch] Error stack:', error?.stack)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to process batch',
          variant: 'destructive',
        })
      }
      setLoading(false)
      setProgress(0)
      setCurrentProcessing({ current: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleSortClick = (field: SortField) => (e: React.MouseEvent) => {
    e.preventDefault()
    handleSort(field)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 ml-1 text-[#5B7FFF]" />
    if (sortDirection === 'desc') return <ArrowDown className="h-3 w-3 ml-1 text-[#5B7FFF]" />
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const handleExportCSV = () => {
    if (typeof window === 'undefined') return
    if (sortedResults.length === 0) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'No results to export',
          variant: 'destructive',
        })
      }
      return
    }

    try {
      const exportData = sortedResults.map((result) => ({
      make: result.car.make,
      model: result.car.model,
      year: result.car.year,
      mileage: result.car.mileage,
      condition: result.car.condition,
      fuel_type: result.car.fuel_type,
      location: result.car.location,
      predicted_price: result.predicted_price,
      confidence_percent: result.confidence_percent ?? 'N/A',
      price_range_min: result.price_range?.min ?? 'N/A',
      price_range_max: result.price_range?.max ?? 'N/A',
      deal_rating: result.deal_rating ?? 'N/A',
      error: result.error ?? '',
    }))

      const csv = Papa.unparse(exportData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      apiClient.downloadBlob(blob, 'batch_predictions.csv')

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'CSV file exported successfully',
        })
      }
    } catch (error: any) {
      console.error('Error exporting CSV:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to export CSV',
          variant: 'destructive',
        })
      }
    }
  }

  const handleExportExcel = async () => {
    if (typeof window === 'undefined') return
    if (sortedResults.length === 0) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'No results to export',
          variant: 'destructive',
        })
      }
      return
    }

    try {
      const exportData = sortedResults.map((result) => ({
        make: result.car.make,
        model: result.car.model,
        year: result.car.year,
        mileage: result.car.mileage,
        condition: result.car.condition,
        fuel_type: result.car.fuel_type,
        location: result.car.location,
        predicted_price: result.predicted_price,
        confidence_percent: result.confidence_percent ?? 'N/A',
        price_range_min: result.price_range?.min ?? 'N/A',
        price_range_max: result.price_range?.max ?? 'N/A',
        deal_rating: result.deal_rating ?? 'N/A',
        error: result.error ?? '',
      }))

      const blob = await apiClient.exportExcel(exportData)
      apiClient.downloadBlob(blob, 'batch_predictions.xlsx')

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Excel file exported successfully',
        })
      }
    } catch (error: any) {
      console.error('Error exporting Excel:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: error?.message || 'Failed to export Excel',
          variant: 'destructive',
        })
      }
    }
  }

  const getRowClassName = (result: ExtendedResult) => {
    if (result.error) return 'bg-red-500/10 border-red-500/20'
    if (result.deal_rating === 'Good') return 'bg-green-500/10 border-green-500/20'
    if (result.deal_rating === 'Poor') return 'bg-red-500/10 border-red-500/20'
    return 'border-[#2a2d3a]'
  }

  const handleUrlPredict = async () => {
    if (!urlInput || !urlInput.trim()) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Please enter a car listing URL',
          variant: 'destructive',
        })
      }
      return
    }

    // Validate URL format
    if (!isValidUrl(urlInput.trim())) {
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Invalid URL format. Please enter a valid URL starting with http:// or https://',
          variant: 'destructive',
        })
      }
      return
    }

    // Warn if URL doesn't look like a car listing
    if (!isCarListingUrl(urlInput.trim()) && !detectedPlatform) {
      if (toast?.toast) {
        toast.toast({
          title: 'Warning',
          description: 'This URL may not be a car listing. Continue anyway?',
          variant: 'default',
        })
      }
    }

    setUrlLoading(true)
    setUrlResult(null)

    try {
      const result = await apiClient.predictFromUrl(urlInput.trim())
      setUrlResult({
        ...result,
        listing_url: urlInput.trim(),
      })

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: 'Car details extracted and price predicted successfully',
        })
      }
    } catch (error: any) {
      console.error('Error predicting from URL:', error)
      const errorDisplay = createError(error, urlInput)
      setError(errorDisplay)
      if (toast?.toast) {
        toast.toast({
          title: errorDisplay.title,
          description: errorDisplay.message,
          variant: 'destructive',
        })
      }
    } finally {
      setUrlLoading(false)
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{(t && typeof t === 'function' ? t('title') : null) || 'Batch Prediction'}</h1>
          <p className="text-[#94a3b8]">{(t && typeof t === 'function' ? t('description') : null) || 'Upload a CSV file to predict prices for multiple cars'}</p>
        </div>

        {/* Bulk URL Processor */}
        <BulkUrlProcessor
          onResults={(bulkResults) => {
            // Add bulk results to main results
            const newResults = bulkResults.map((r) => ({
              car: r.result.extracted_data,
              predicted_price: r.result.predicted_price,
              confidence_interval: r.result.confidence_interval,
            }))
            setResults([...results, ...newResults])
          }}
        />

        {/* URL Prediction Section */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-[#5B7FFF]" />
              <CardTitle>Predict Price from Car Listing URL</CardTitle>
            </div>
            <CardDescription className="text-[#94a3b8]">
              Paste a car listing URL to extract details and predict price
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="url"
                    placeholder="https://www.iqcars.net/en/car/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !urlLoading) {
                        handleUrlPredict()
                      }
                    }}
                    disabled={urlLoading}
                    className="pr-12"
                  />
                  {detectedPlatform && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <PlatformBadge platform={detectedPlatform} />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleUrlPredict}
                  disabled={!urlInput.trim() || urlLoading}
                  className="bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 min-w-[180px]"
                >
                  {urlLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze & Predict Price'
                  )}
                </Button>
              </div>

              {/* Loading Stages */}
              {urlLoading && <LoadingStages isLoading={urlLoading} />}
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <ErrorDisplay
                  error={error}
                  onRetry={handleUrlPredict}
                  onDismiss={() => setError(null)}
                />
              )}
            </AnimatePresence>

            {/* URL Prediction Results */}
            <AnimatePresence>
              {urlResult && (
                <UrlResultCard
                  extractedData={urlResult.extracted_data}
                  predictedPrice={urlResult.predicted_price}
                  listingPrice={urlResult.listing_price}
                  priceComparison={urlResult.price_comparison}
                  confidenceInterval={urlResult.confidence_interval}
                  listingUrl={urlResult.listing_url}
                  carImage={urlResult.car_image}
                  message={urlResult.message}
                />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              {(t && typeof t === 'function' ? t('upload.instructions') : null) || 'Upload a CSV file with car data'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-[#5B7FFF] bg-[#5B7FFF]/10'
                      : 'border-[#2a2d3a] hover:border-[#5B7FFF]'
                  }`}
                >
                  {file ? (
                    <div className="text-center">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-[#5B7FFF]" />
                      <p className="text-sm text-white font-medium">{file.name}</p>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-[#94a3b8]" />
                      <p className="text-sm text-[#94a3b8]">{(t && typeof t === 'function' ? t('upload.placeholder') : null) || 'Click to upload CSV file'}</p>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        Drag & drop or click to browse (Max 5MB, 1000 rows)
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94a3b8]">
                      {currentProcessing.total > 0
                        ? `Processing ${currentProcessing.current}/${currentProcessing.total} cars...`
                        : 'Processing...'}
                    </span>
                    <span className="text-[#5B7FFF] font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden border border-[#2a2d3a]">
                    <motion.div
                      className="h-full bg-[#5B7FFF]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleProcess}
                disabled={!file || loading}
                className="flex-1 bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 min-w-[120px]"
              >
                {loading ? 'Processing...' : ((t && typeof t === 'function' ? t('process') : null) || 'Process')}
              </Button>
              <Button
                onClick={handleDownloadSample}
                variant="outline"
                className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
              {file && !loading && (
                <Button
                  onClick={() => {
                    setFile(null)
                    setResults([])
                    setProgress(0)
                    setCurrentProcessing({ current: 0, total: 0 })
                  }}
                  variant="outline"
                  size="icon"
                  className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filter Panel */}
        {enhancedResults.length > 0 && (
          <FilterPanel results={enhancedResults} onFilterChange={setFilteredResults} />
        )}

        {/* Summary Stats Box */}
        <AnimatePresence>
          {summaryStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6">
                <CardHeader>
                  <CardTitle>Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-[#94a3b8]">Total Cars</p>
                      <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#94a3b8]">Successful</p>
                      <p className="text-2xl font-bold text-green-500">{summaryStats.successful}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#94a3b8]">Failed</p>
                      <p className="text-2xl font-bold text-red-500">{summaryStats.failed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#94a3b8]">Average Price</p>
                      <p className="text-2xl font-bold text-[#5B7FFF]">
                        {formatCurrency(summaryStats.averagePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#94a3b8]">Best Deal</p>
                      <p className="text-lg font-semibold text-green-500">{summaryStats.bestDeal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#94a3b8]">Highest Value</p>
                      <p className="text-lg font-semibold text-[#5B7FFF]">{summaryStats.highestValue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Dashboard */}
        {enhancedResults.length > 0 && (
          <Card className="border-[#2a2d3a] bg-[#1a1d29] mb-6">
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription className="text-[#94a3b8]">
                Visual insights into your batch predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={statsDashboardRef}>
                <StatsDashboard results={enhancedResults} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Alert Manager - Always visible for managing alerts */}
        <PriceAlertManager />

        {/* Compare Mode */}
        {selectedForCompare.size > 0 && (
          <CompareMode
            results={sortedResults}
            selectedIds={selectedForCompare}
            onSelectionChange={(id, selected) => {
              const newSet = new Set(selectedForCompare)
              if (selected) {
                if (newSet.size < 4) {
                  newSet.add(id)
                }
              } else {
                newSet.delete(id)
              }
              setSelectedForCompare(newSet)
            }}
            onClearSelection={() => setSelectedForCompare(new Set())}
          />
        )}

        {/* Results Table - Desktop View */}
        <AnimatePresence>
          {mounted && !isMobile && sortedResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-[#2a2d3a] bg-[#1a1d29]">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>{(t && typeof t === 'function' ? t('results.title') : null) || 'Results'}</CardTitle>
                      <CardDescription className="text-[#94a3b8]">
                        {sortedResults.length} cars processed
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        className="border-[#2a2d3a] hover:bg-[#2a2d3a]"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        className="border-[#2a2d3a] hover:bg-[#2a2d3a]"
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export Excel
                      </Button>
                      <ExportOptions results={enhancedResults} statsDashboardRef={statsDashboardRef} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="inline-block min-w-full align-middle">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="border-[#2a2d3a]">
                            <TableHead className="text-[#94a3b8] w-12 hidden md:table-cell">
                              Compare
                            </TableHead>
                            <TableHead
                              className="text-[#94a3b8] cursor-pointer hover:text-white transition-colors"
                              onClick={handleSortClick('make')}
                            >
                              <div className="flex items-center">
                                Make
                                {getSortIcon('make')}
                              </div>
                            </TableHead>
                            <TableHead
                              className="text-[#94a3b8] cursor-pointer hover:text-white transition-colors"
                              onClick={handleSortClick('model')}
                            >
                              <div className="flex items-center">
                                Model
                                {getSortIcon('model')}
                              </div>
                            </TableHead>
                            <TableHead
                              className="text-[#94a3b8] cursor-pointer hover:text-white transition-colors"
                              onClick={handleSortClick('year')}
                            >
                              <div className="flex items-center">
                                Year
                                {getSortIcon('year')}
                              </div>
                            </TableHead>
                            <TableHead className="text-[#94a3b8] hidden md:table-cell">Mileage</TableHead>
                            <TableHead className="text-[#94a3b8] hidden lg:table-cell">Condition</TableHead>
                            <TableHead
                              className="text-right text-[#94a3b8] cursor-pointer hover:text-white transition-colors"
                              onClick={handleSortClick('predicted_price')}
                            >
                              <div className="flex items-center justify-end">
                                Price
                                {getSortIcon('predicted_price')}
                              </div>
                            </TableHead>
                            <TableHead
                              className="text-center text-[#94a3b8] cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                              onClick={handleSortClick('confidence')}
                            >
                              <div className="flex items-center justify-center">
                                Confidence
                                {getSortIcon('confidence')}
                              </div>
                            </TableHead>
                            <TableHead className="text-[#94a3b8] hidden xl:table-cell">Price Range</TableHead>
                            <TableHead
                              className="text-center text-[#94a3b8] cursor-pointer hover:text-white transition-colors"
                              onClick={handleSortClick('deal_rating')}
                            >
                              <div className="flex items-center justify-center">
                                Deal
                                {getSortIcon('deal_rating')}
                              </div>
                            </TableHead>
                            <TableHead className="text-[#94a3b8] text-center">Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {sortedResults.map((result, index) => {
                              const favoriteId = `${result.car.make}-${result.car.model}-${result.car.year}-${index}`
                              const isFavorite = favorites.isFavorite(favoriteId)

                              return (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`${getRowClassName(result)} hover:bg-[#2a2d3a]/50 transition-colors`}
                              >
                                <TableCell className="text-center hidden md:table-cell">
                                  <Checkbox
                                    checked={selectedForCompare.has(index)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedForCompare)
                                      if (checked && newSet.size < 4) {
                                        newSet.add(index)
                                      } else {
                                        newSet.delete(index)
                                      }
                                      setSelectedForCompare(newSet)
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-white font-medium">{result.car.make}</TableCell>
                                <TableCell className="text-white">{result.car.model}</TableCell>
                                <TableCell className="text-white">{result.car.year}</TableCell>
                                <TableCell className="text-white hidden md:table-cell">
                                  {result.car.mileage.toLocaleString()} km
                                </TableCell>
                                <TableCell className="text-white hidden lg:table-cell">{result.car.condition}</TableCell>
                                <TableCell className="text-right font-semibold text-[#5B7FFF]">
                                  {result.error ? (
                                    <span className="text-red-500">N/A</span>
                                  ) : (
                                    formatCurrency(result.predicted_price)
                                  )}
                                </TableCell>
                                <TableCell className="text-center hidden lg:table-cell">
                                  {result.confidence_percent !== undefined ? (
                                    <ConfidenceBreakdown result={result}>
                                      <span className={`font-medium cursor-pointer hover:underline ${
                                        result.confidence_percent >= 80 ? 'text-green-500' :
                                        result.confidence_percent >= 60 ? 'text-yellow-500' :
                                        'text-red-500'
                                      }`}>
                                        {result.confidence_percent}%
                                      </span>
                                    </ConfidenceBreakdown>
                                  ) : (
                                    <span className="text-[#94a3b8]">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[#94a3b8] text-sm hidden xl:table-cell">
                                  {result.price_range ? (
                                    <div className="flex flex-col">
                                      <span>{formatCurrency(result.price_range.min)}</span>
                                      <span className="text-xs">to {formatCurrency(result.price_range.max)}</span>
                                    </div>
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {result.deal_rating && summaryStats && (
                                    <DealQualityTooltip
                                      result={result}
                                      averagePrice={summaryStats.averagePrice}
                                    >
                                      <span className={`px-2 py-1 rounded text-xs font-semibold cursor-help ${
                                        result.deal_rating === 'Good' ? 'bg-green-500/20 text-green-500' :
                                        result.deal_rating === 'Poor' ? 'bg-red-500/20 text-red-500' :
                                        'bg-yellow-500/20 text-yellow-500'
                                      }`}>
                                        {result.deal_rating}
                                      </span>
                                    </DealQualityTooltip>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {result.error ? (
                                    <span className="text-red-500 text-xs" title={result.error}>
                                      ⚠️
                                    </span>
                                  ) : (
                                    <span className="text-green-500">✓</span>
                                  )}
                                </TableCell>
                              </motion.tr>
                            )})}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Card View */}
        {mounted && isMobile && sortedResults.length > 0 && (
          <MobileCardView
            results={sortedResults}
            isFavorite={(index) => {
              const result = sortedResults[index]
              const favoriteId = `${result.car.make}-${result.car.model}-${result.car.year}-${index}`
              return favorites.isFavorite(favoriteId)
            }}
            onToggleFavorite={(index) => {
              const result = sortedResults[index]
              const favoriteId = `${result.car.make}-${result.car.model}-${result.car.year}-${index}`
              favorites.toggleFavorite({
                id: favoriteId,
                make: result.car.make,
                model: result.car.model,
                year: result.car.year,
                predictedPrice: result.predicted_price,
                timestamp: Date.now(),
              })
            }}
            onViewDetails={() => {}}
          />
        )}
      </div>
    </div>
  )
}
