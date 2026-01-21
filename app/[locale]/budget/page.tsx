"use client"

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2, Search, Car, ArrowRight, Heart, MapPin, Gauge,
  TrendingDown, Save, X, ChevronDown, ChevronUp, Grid3x3, List,
  CheckCircle2, Trophy, Flame, Sparkles, Bookmark, GitCompare, Filter
} from 'lucide-react'
import { ComparisonBar } from '@/components/marketplace/ComparisonBar'
import { ListingCardSkeleton } from '@/components/common/LoadingSkeleton'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BudgetSearchResponse, BudgetCarResult, CarFeatures } from '@/lib/types'
import { CONDITIONS, FUEL_TYPES } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

type SortOption = 'price_low' | 'price_high' | 'year_new' | 'mileage_low' | 'best_deals'
type ViewMode = 'grid' | 'list'

// Car type detection (simple heuristic)
const getCarType = (model: string): string => {
  const modelLower = model.toLowerCase()
  if (modelLower.includes('truck') || modelLower.includes('pickup') || modelLower.includes('f-150') || modelLower.includes('silverado') || modelLower.includes('tundra')) return 'Truck'
  if (modelLower.includes('suv') || modelLower.includes('x5') || modelLower.includes('q5') || modelLower.includes('cr-v') || modelLower.includes('rav4')) return 'SUV'
  if (modelLower.includes('coupe') || modelLower.includes('camaro') || modelLower.includes('mustang') || modelLower.includes('corvette')) return 'Coupe'
  return 'Sedan'
}

// Get car icon color based on make
const getCarIconColor = (make: string): string => {
  const colors: Record<string, string> = {
    'Toyota': '#EB0A1E',
    'Honda': '#000000',
    'Ford': '#003478',
    'BMW': '#1C69D4',
    'Mercedes-Benz': '#00ADEF',
    'Audi': '#BB0A30',
    'Tesla': '#E31937',
  }
  return colors[make] || '#5B7FFF'
}

export default function BudgetPage() {
  const [mounted, setMounted] = useState(false)
  const [budget, setBudget] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(100000)
  const [selectedMake, setSelectedMake] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [minYear, setMinYear] = useState<number>(2010)
  const [maxYear, setMaxYear] = useState<number>(2025)
  const [yearRange, setYearRange] = useState<{ min: number; max: number }>({ min: 2010, max: 2025 })
  const [maxMileage, setMaxMileage] = useState<number>(200000)
  const [condition, setCondition] = useState<string>('')
  const [fuelType, setFuelType] = useState<string>('')
  const [transmission, setTransmission] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('both')
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>(CONDITIONS)
  const [fuelTypes, setFuelTypes] = useState<string[]>(FUEL_TYPES)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BudgetSearchResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('best_deals')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedCars, setSelectedCars] = useState<Set<number>>(new Set())
  const [comparisonCars, setComparisonCars] = useState<Array<{
    id: number
    listing_id?: number
    make: string
    model: string
    year: number
    price: number
    mileage: number
    image_url?: string
    condition?: string
    fuel_type?: string
  }>>([])
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false)
  const pageSize = 20

  // Hooks must be called unconditionally BEFORE any conditional returns
  const t = useTranslations('budget')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const locale = useLocale() || 'en'
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }
  const { isAuthenticated } = useAuth()
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false)
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate active filter count - MUST be before conditional return
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (minPrice > 0) count++
    if (maxPrice < 200000) count++
    if (selectedMake) count++
    if (selectedModel) count++
    if (minYear > 2010) count++
    if (maxYear < 2025) count++
    if (maxMileage < 200000) count++
    if (condition) count++
    if (fuelType) count++
    if (transmission) count++
    if (location) count++
    if (sourceFilter !== 'both') count++
    return count
  }, [minPrice, maxPrice, selectedMake, selectedModel, minYear, maxYear, maxMileage, condition, fuelType, transmission, location, sourceFilter])

  // Sort results - MUST be before conditional return
  const sortedResults = useMemo(() => {
    if (!results || !results.results || !Array.isArray(results.results)) {
      return []
    }

    const sorted = [...results.results].filter(car => car != null)

    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'price_high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
      case 'year_new':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0))
      case 'mileage_low':
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0))
      case 'best_deals':
        // Sort by price difference (closest to budget) or price (ascending)
        return sorted.sort((a, b) => {
          if (a.price_difference !== undefined && b.price_difference !== undefined) {
            return a.price_difference - b.price_difference
          }
          return (a.price || 0) - (b.price || 0)
        })
      default:
        return sorted
    }
  }, [results, sortBy])

  // Calculate average price for deal detection - MUST be before conditional return
  const avgPrice = useMemo(() => {
    if (!results || results.results.length === 0) return 0
    return results.results.reduce((sum, car) => sum + (car.price || 0), 0) / results.results.length
  }, [results])

  // Define functions before useEffect hooks that use them
  const loadMetadata = async () => {
    try {
      const metadata = await apiClient.getMetadata()
      if (metadata.conditions.length > 0) {
        setConditions(metadata.conditions)
      }
      if (metadata.fuel_types.length > 0) {
        setFuelTypes(metadata.fuel_types)
      }
    } catch (error) {
      // Use defaults from constants
    }
  }

  const loadInitialData = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const [makesList, locationsList] = await Promise.all([
          apiClient.getMakes(),
          apiClient.getLocations()
        ])
        setMakes(makesList || [])
        setLocations(locationsList || [])
        return // Success, exit retry loop
      } catch (error: any) {
        console.error(`Error loading initial data (attempt ${attempt}/${retries}):`, error)
        
        if (attempt === retries) {
          // Last attempt failed
          if (toast?.toast) {
            toast.toast({
              title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
              description: error?.message || 'Failed to load filter options. Please refresh the page.',
              variant: 'destructive',
            })
          }
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
  }

  const loadModels = async (make: string) => {
    try {
      if (!make || typeof make !== 'string') {
        setModels([])
        return
      }
      const modelsList = await apiClient.getModels(make)
      setModels(modelsList || [])
      setSelectedModel('')
    } catch (error) {
      console.error('Error loading models:', error)
      setModels([])
    }
  }

  // Keep filters open on desktop by default - MUST be before conditional return
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      try {
        if (window && window.innerWidth >= 768) {
          setFiltersOpen(true)
        }
      } catch (error) {
        console.error('Resize handler error:', error)
      }
    }

    try {
      window.addEventListener('resize', handleResize)
      handleResize() // Set initial state
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResize)
        }
      }
    } catch (error) {
      console.error('Window event listener error:', error)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
    loadMetadata()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Real-time sync: Poll for new marketplace listings every 30 seconds
  useEffect(() => {
    if (!results || loading) return

    const interval = setInterval(() => {
      // Only refresh if we're on page 1 and have results
      if (currentPage === 1 && results.total > 0) {
        handleSearch(1)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSearch omitted to avoid recreating interval on every form change
  }, [results, currentPage, loading])

  useEffect(() => {
    if (selectedMake) {
      loadModels(selectedMake)
    } else {
      setModels([])
      setSelectedModel('')
    }
  }, [selectedMake])

  // Year range: use 2010–2025 when make is selected (getAvailableYears not in API)
  useEffect(() => {
    if (selectedMake && selectedMake.trim() !== '') {
      setYearRange({ min: 2010, max: 2025 })
      setMinYear((prev) => Math.max(2010, Math.min(2025, prev)))
      setMaxYear((prev) => Math.max(2010, Math.min(2025, prev)))
    } else {
      setYearRange({ min: 2010, max: 2025 })
    }
  }, [selectedMake, selectedModel])

  // Ensure minYear <= maxYear after year range or user changes
  useEffect(() => {
    if (minYear > maxYear) setMaxYear(minYear)
  }, [minYear, maxYear])

  // Quick filter handlers with preset budgets
  const quickFilters = [
    { label: 'Under $5k', action: () => { setBudget(null); setMinPrice(0); setMaxPrice(5000); handleSearch(1) } },
    { label: '$5k-$10k', action: () => { setBudget(null); setMinPrice(5000); setMaxPrice(10000); handleSearch(1) } },
    { label: '$10k-$20k', action: () => { setBudget(null); setMinPrice(10000); setMaxPrice(20000); handleSearch(1) } },
    { label: '$20k-$30k', action: () => { setBudget(null); setMinPrice(20000); setMaxPrice(30000); handleSearch(1) } },
    { label: '$30k-$50k', action: () => { setBudget(null); setMinPrice(30000); setMaxPrice(50000); handleSearch(1) } },
    { label: '$50k+', action: () => { setBudget(null); setMinPrice(50000); setMaxPrice(200000); handleSearch(1) } },
    { label: 'Low Mileage (<50k km)', action: () => { setMaxMileage(50000); handleSearch(1) } },
    { label: 'New Cars Only', action: () => { setMinYear(2020); setCondition('New'); handleSearch(1) } },
  ]

  const handleSearch = async (page: number = 1, retries = 3) => {
    setLoading(true)
    setCurrentPage(page)

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const searchParams: any = {
        budget: budget && budget > 0 ? budget : undefined,
        min_price: budget && budget > 0 ? undefined : (minPrice > 0 ? minPrice : undefined),
        max_price: budget && budget > 0 ? undefined : (maxPrice > 0 && maxPrice < 200000 ? maxPrice : undefined),
        make: selectedMake && selectedMake !== '__all__' ? selectedMake : undefined,
        model: selectedModel && selectedModel !== '__all__' ? selectedModel : undefined,
        min_year: minYear > 1900 ? minYear : undefined,
        max_year: maxYear < 2026 ? maxYear : undefined,
        max_mileage: maxMileage > 0 && maxMileage < 500000 ? maxMileage : undefined,
        condition: condition && condition !== '__all__' ? condition : undefined,
        fuel_type: fuelType && fuelType !== '__all__' ? fuelType : undefined,
        transmission: transmission && transmission !== '__all__' ? transmission : undefined,
        location: location && location !== '__all__' ? location : undefined,
        source: sourceFilter || 'both',
        page,
        page_size: pageSize,
      }

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === undefined) {
          delete searchParams[key]
        }
      })

      const data = await apiClient.searchBudget(searchParams)
      if (data && typeof data === 'object') {
        // Check for error in response
        if (data.error) {
          throw new Error(data.error)
        }
        // Ensure results is an array
        if (data.results && !Array.isArray(data.results)) {
          console.error('Invalid results format:', data.results)
          data.results = []
        }
        if (!data.results) {
          data.results = []
        }
        setResults(data)
        
        // Scroll to results
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          try {
            setTimeout(() => {
              try {
                const resultsSection = document.getElementById('results-section')
                if (resultsSection) {
                  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              } catch (scrollError) {
                console.error('Scroll error:', scrollError)
                // Non-critical error, continue
              }
            }, 100)
          } catch (error) {
            console.error('Error setting up scroll:', error)
            // Non-critical error, continue
          }
        }
        
        setLoading(false)
        return // Success, exit retry loop
      } else {
        throw new Error('Invalid response from server')
      }
      } catch (error: any) {
        console.error(`Error searching cars (attempt ${attempt}/${retries}):`, error)
        
        if (attempt === retries) {
          // Last attempt failed
          const errorMessage = error?.message || error?.response?.data?.error || 'Failed to search cars. Please check if the dataset is loaded correctly.'
          
          if (toast?.toast) {
            toast.toast({
              title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
              description: errorMessage,
              variant: 'destructive',
            })
          }
          
          // Set results with error message
          setResults({
            total: 0,
            page: page,
            page_size: pageSize,
            results: [],
            error: errorMessage
          })
          setLoading(false)
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
  }

  const handleUseCar = (car: BudgetCarResult | null | undefined) => {
    try {
      if (!car || typeof car !== 'object') {
        console.error('Invalid car data')
        return
      }

      const carFeatures: CarFeatures = {
        year: car.year || 2020,
        mileage: car.mileage || 0,
        engine_size: car.engine_size || 2.5,
        cylinders: car.cylinders || 4,
        make: car.make || '',
        model: car.model || '',
        condition: car.condition || 'Good',
        fuel_type: car.fuel_type || 'Gasoline',
        location: car.location || 'Unknown',
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem('prefillCar', JSON.stringify(carFeatures))
        } catch (error) {
          console.error('SessionStorage error:', error)
          // Non-critical error, continue
        }
      }

      if (router && typeof router.push === 'function') {
        router.push(`/${locale || 'en'}/predict`)
      }

      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: `Car details loaded: ${car.make || 'Unknown'} ${car.model || ''} (${car.year || 'N/A'})`,
        })
      }
    } catch (error) {
      console.error('Error using car:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Failed to load car details',
          variant: 'destructive',
        })
      }
    }
  }

  const handleReset = () => {
    setBudget(null)
    setMinPrice(0)
    setMaxPrice(100000)
    setSelectedMake('')
    setSelectedModel('')
    setMinYear(2010)
    setMaxYear(2025)
    setYearRange({ min: 2010, max: 2025 })
    setMaxMileage(200000)
    setCondition('')
    setFuelType('')
    setTransmission('')
    setLocation('')
    setSourceFilter('both')
    setResults(null)
    setCurrentPage(1)
    setSelectedCars(new Set())
  }

  const toggleCarSelection = (index: number) => {
    const car = sortedResults[index]
    if (!car) return

    const newSelected = new Set(selectedCars)
    const carId: number = car.listing_id ?? index
    
    if (newSelected.has(index)) {
      newSelected.delete(index)
      // Remove from comparison cars
      setComparisonCars(prev => prev.filter(c => c.id !== carId))
    } else {
      // Limit to 3 cars for comparison
      if (comparisonCars.length >= 3) {
        if (toast?.toast) {
          toast.toast({
            title: 'Maximum 3 cars',
            description: 'You can compare up to 3 cars at a time',
            variant: 'default',
          })
        }
        return
      }
      
      newSelected.add(index)
      // Add to comparison cars
      const comparisonCar = {
        id: carId,
        listing_id: car.listing_id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        image_url: car.image_url,
        condition: car.condition,
        fuel_type: car.fuel_type,
      }
      setComparisonCars(prev => [...prev, comparisonCar])
    }
    setSelectedCars(newSelected)
  }

  const toggleFavorite = (index: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(index)) {
      newFavorites.delete(index)
    } else {
      newFavorites.add(index)
    }
    setFavorites(newFavorites)
  }

  const handleCompareSelected = () => {
    try {
      if (selectedCars.size < 2) {
        if (toast?.toast) {
          toast.toast({
            title: 'Select at least 2 cars',
            description: 'Please select 2 or more cars to compare',
            variant: 'default',
          })
        }
        return
      }

      // Store selected cars and navigate to compare page
      const carsToCompare = sortedResults.filter((_, idx) => selectedCars.has(idx))
      if (carsToCompare.length < 2) {
        if (toast?.toast) {
          toast.toast({
            title: 'Error',
            description: 'Failed to prepare cars for comparison',
            variant: 'destructive',
          })
        }
        return
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem('carsToCompare', JSON.stringify(carsToCompare))
        } catch (error) {
          console.error('SessionStorage error:', error)
          // Non-critical error, continue
        }
      }

      if (router && typeof router.push === 'function') {
        router.push(`/${locale || 'en'}/compare`)
      }
    } catch (error) {
      console.error('Error comparing selected cars:', error)
      if (toast?.toast) {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: 'Failed to compare cars',
          variant: 'destructive',
        })
      }
    }
  }

  const getDealBadges = (car: BudgetCarResult | null | undefined, index: number) => {
    const badges: Array<{ label: string; color: string; icon: any }> = []
    if (!car || !car.price || avgPrice === 0) return badges
    const priceDiff = ((car.price - avgPrice) / avgPrice) * 100

    if (priceDiff <= -20) {
      badges.push({ label: 'Best Deal', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Trophy })
    } else if (priceDiff <= -10) {
      badges.push({ label: 'Hot Deal 🔥', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Flame })
    }

    if (car.mileage && car.mileage < 50000) {
      badges.push({ label: 'Low Mileage', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Gauge })
    }

    if (car.condition && (car.condition === 'Excellent' || car.condition === 'Like New' || car.condition === 'New')) {
      badges.push({ label: 'Like New', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Sparkles })
    }

    return badges
  }

  const handleSaveSearch = () => {
    if (!searchName.trim() || !isAuthenticated) return

    const filters = {
      min_price: minPrice > 0 ? minPrice : undefined,
      max_price: maxPrice < 200000 ? maxPrice : undefined,
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      min_year: minYear > 2000 ? minYear : undefined,
      max_year: maxYear < 2025 ? maxYear : undefined,
      max_mileage: maxMileage < 200000 ? maxMileage : undefined,
      condition: condition || undefined,
      fuel_type: fuelType || undefined,
      location: location || undefined,
    }

    apiClient.saveSearch(searchName.trim(), filters, true, 'instant')
      .then(() => {
        if (toast?.toast) {
          toast.toast({
            title: 'Search saved!',
            description: 'You\'ll receive email alerts when new cars match your criteria'
          })
        }
        setSaveSearchDialogOpen(false)
        setSearchName('')
      })
      .catch((error: any) => {
        if (toast?.toast) {
          toast.toast({
            title: 'Error',
            description: error.message || 'Failed to save search',
            variant: 'destructive'
          })
        }
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d29] to-[#0f1117]">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#5B7FFF] via-[#8B5CF6] to-[#EC4899] py-16 md:py-24"
      >
        {/* Animated Background Cars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => {
            const startY = Math.random() * 400
            const endY = Math.random() * 400
            const startX = -100
            // Use a large pixel value that will work across screen sizes
            const endX = 2000

            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: startX, y: startY }}
                animate={{
                  x: [startX, endX],
                  y: [startY, endY],
                }}
                transition={{
                  duration: 15 + Math.random() * 10,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: Math.random() * 5,
                }}
              >
                <Car className="h-12 w-12 text-white/10" />
              </motion.div>
            )
          })}
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100"
            >
              {(t && typeof t === 'function' ? t('title') : null) || 'Find Cars by Budget'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-8"
            >
              {(t && typeof t === 'function' ? t('description') : null) || 'Search for cars within your budget'}
            </motion.p>
          </div>
        </div>
      </motion.div>

      <div className="container px-4 sm:px-6 lg:px-8 py-6 md:py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-7xl">
          {/* Preset budget chips — horizontal scroll on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {quickFilters.map((filter, idx) => (
              <motion.button
                key={filter.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={filter.action}
                className="shrink-0 min-h-[44px] px-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white text-sm hover:bg-white/10 transition-all duration-200 whitespace-nowrap"
              >
                {filter.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Mobile: one budget input + Filters button (filters in bottom sheet) */}
          <div className="md:hidden mb-4 space-y-3">
            <Label className="text-white">Budget ($)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 20000"
              value={budget || ''}
              onChange={(e) => setBudget(e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full min-h-[44px] border-white/20 bg-white/5 text-white text-base"
            />
            <Button
              variant="outline"
              onClick={() => setFiltersSheetOpen(true)}
              className="w-full min-h-[44px] border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Button>
          </div>

          {/* Mobile: bottom sheet for filters */}
          <AnimatePresence>
            {filtersSheetOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden"
                  onClick={() => setFiltersSheetOpen(false)}
                  aria-hidden
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[91] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#1a1d29] md:hidden"
                >
                  <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1d29]">
                    <span className="font-semibold text-white">Filters</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white min-w-[44px] min-h-[44px]" onClick={() => setFiltersSheetOpen(false)} aria-label="Close"><X className="h-5 w-5" /></Button>
                  </div>
                  <div className="p-4 space-y-4">
                    {!budget || budget <= 0 ? (
                      <div className="grid gap-2">
                        <Label className="text-white">Min: {formatCurrency(minPrice)}</Label>
                        <Slider value={[minPrice]} onValueChange={(v) => { setMinPrice(Array.isArray(v) ? v[0] : v); setBudget(null) }} min={0} max={200000} step={1000} className="w-full" />
                        <Label className="text-white">Max: {formatCurrency(maxPrice)}</Label>
                        <Slider value={[maxPrice]} onValueChange={(v) => { setMaxPrice(Array.isArray(v) ? v[0] : v); setBudget(null) }} min={0} max={200000} step={1000} className="w-full" />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Budget ±15%: {formatCurrency(budget * 0.85)} – {formatCurrency(budget * 1.15)}</p>
                    )}
                    <div className="grid gap-2">
                      <Label className="text-white">{(t && typeof t === 'function' ? t('preferredMakes') : null) || 'Make'}</Label>
                      <Select value={selectedMake || '__all__'} onValueChange={(v) => setSelectedMake(v === '__all__' ? '' : v)}>
                        <SelectTrigger className="min-h-[44px] border-white/20 bg-white/5 text-white"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent className="bg-[#1a1d29] border-white/10"><SelectItem value="__all__" className="text-white">All</SelectItem>{makes.map((m) => <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-white">{(t && typeof t === 'function' ? t('minYear') : null) || 'Min Year'}: {minYear}</Label>
                      <Slider value={[minYear]} onValueChange={(v) => setMinYear(Array.isArray(v) ? v[0] : v)} min={yearRange.min} max={Math.min(yearRange.max, maxYear)} step={1} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-white">Max Year: {maxYear}</Label>
                      <Slider value={[maxYear]} onValueChange={(v) => setMaxYear(Array.isArray(v) ? v[0] : v)} min={Math.max(yearRange.min, minYear)} max={yearRange.max} step={1} className="w-full" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-white">{(t && typeof t === 'function' ? t('maxMileage') : null) || 'Max Mileage'}: {formatNumber(maxMileage)} km</Label>
                      <Slider value={[maxMileage]} onValueChange={(v) => setMaxMileage(Array.isArray(v) ? v[0] : v)} min={0} max={500000} step={1000} className="w-full" />
                    </div>
                    <Button variant="outline" className="w-full min-h-[44px] border-white/20 bg-white/5 text-white" onClick={() => setFiltersSheetOpen(false)}>Apply</Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Desktop: Filters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block"
          >
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8 shadow-2xl">
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-white">Filters</CardTitle>
                      {activeFilterCount > 0 && (
                        <Badge className="bg-[#5B7FFF] text-white">
                          {activeFilterCount} active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSearch(1)}
                        disabled={loading}
                        className="bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white min-h-[44px]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            {(t && typeof t === 'function' ? t('findCars') : null) || 'Find Cars'}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white min-h-[44px]"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                      >
                        {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent className="md:block">
                  <CardContent className="space-y-6">
                    {/* Budget Input */}
                    <div className="space-y-2">
                      <Label className="text-white">Budget (searches ±15% range)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter your budget (e.g., 20000)"
                          value={budget || ''}
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : null
                            setBudget(value)
                            // Don't reset min/max price to 0, just disable the sliders
                            // The backend will use budget ±15% instead
                          }}
                          className="border-white/20 bg-white/5 text-white"
                        />
                        <Button
                          onClick={() => {
                            if (budget && budget > 0) {
                              handleSearch(1)
                            }
                          }}
                          disabled={!budget || budget <= 0}
                          className="bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white"
                        >
                          Search Budget
                        </Button>
                      </div>
                      {budget && budget > 0 && (
                        <p className="text-xs text-white/50">
                          Searching cars priced between {formatCurrency(budget * 0.85)} and {formatCurrency(budget * 1.15)}
                        </p>
                      )}
                    </div>

                    {/* Price Range */}
                    {budget && budget > 0 ? (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-white text-sm">
                          Using budget search mode (±15% range). Clear budget to use custom price range.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-white">Min Price: {formatCurrency(minPrice)}</Label>
                          <Slider
                            value={[minPrice]}
                            onValueChange={(values) => {
                              const value = Array.isArray(values) ? values[0] : values
                              setMinPrice(value)
                              setBudget(null) // Clear budget when using range
                            }}
                            min={0}
                            max={200000}
                            step={1000}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Max Price: {formatCurrency(maxPrice)}</Label>
                          <Slider
                            value={[maxPrice]}
                            onValueChange={(values) => {
                              const value = Array.isArray(values) ? values[0] : values
                              setMaxPrice(value)
                              setBudget(null) // Clear budget when using range
                            }}
                            min={0}
                            max={200000}
                            step={1000}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Make and Model */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-white">{(t && typeof t === 'function' ? t('preferredMakes') : null) || 'Preferred Makes'}</Label>
                        <Select
                          value={selectedMake || '__all__'}
                          onValueChange={(val) => setSelectedMake(val === '__all__' ? '' : val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder="All makes" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All makes</SelectItem>
                            {makes.map((make) => (
                              <SelectItem key={make} value={make} className="text-white">
                                {make}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Model</Label>
                        <Select
                          value={selectedModel || '__all__'}
                          onValueChange={(val) => setSelectedModel(val === '__all__' ? '' : val)}
                          disabled={!selectedMake || selectedMake === '__all__'}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder={selectedMake ? "All models" : "Select make first"} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All models</SelectItem>
                            {models.map((model) => (
                              <SelectItem key={model} value={model} className="text-white">
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Year and Mileage */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-white">{(t && typeof t === 'function' ? t('minYear') : null) || 'Min Year'}: {minYear}</Label>
                        <Slider
                          value={[minYear]}
                          onValueChange={(values) => {
                            const value = Array.isArray(values) ? values[0] : values
                            setMinYear(value)
                          }}
                          min={yearRange.min}
                          max={Math.min(yearRange.max, maxYear)}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Max Year: {maxYear}</Label>
                        <Slider
                          value={[maxYear]}
                          onValueChange={(values) => {
                            const value = Array.isArray(values) ? values[0] : values
                            setMaxYear(value)
                          }}
                          min={Math.max(yearRange.min, minYear)}
                          max={yearRange.max}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-white">{(t && typeof t === 'function' ? t('maxMileage') : null) || 'Max Mileage'}: {formatNumber(maxMileage)} km</Label>
                        <Slider
                          value={[maxMileage]}
                          onValueChange={(values) => {
                            const value = Array.isArray(values) ? values[0] : values
                            setMaxMileage(value)
                          }}
                          min={0}
                          max={500000}
                          step={1000}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Condition, Fuel Type, Transmission, Location, Source */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-white">{(t && typeof t === 'function' ? t('condition') : null) || 'Condition'}</Label>
                        <Select
                          value={condition || '__all__'}
                          onValueChange={(val) => setCondition(val === '__all__' ? '' : val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder="All conditions" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All conditions</SelectItem>
                            {conditions.map((cond) => (
                              <SelectItem key={cond} value={cond} className="text-white">
                                {cond}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Fuel Type</Label>
                        <Select
                          value={fuelType || '__all__'}
                          onValueChange={(val) => setFuelType(val === '__all__' ? '' : val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder="All fuel types" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All fuel types</SelectItem>
                            {fuelTypes.map((fuel) => (
                              <SelectItem key={fuel} value={fuel} className="text-white">
                                {fuel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Transmission</Label>
                        <Select
                          value={transmission || '__all__'}
                          onValueChange={(val) => setTransmission(val === '__all__' ? '' : val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder="All transmissions" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All transmissions</SelectItem>
                            <SelectItem value="Automatic" className="text-white">Automatic</SelectItem>
                            <SelectItem value="Manual" className="text-white">Manual</SelectItem>
                            <SelectItem value="CVT" className="text-white">CVT</SelectItem>
                            <SelectItem value="Other" className="text-white">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Location</Label>
                        <Select
                          value={location || '__all__'}
                          onValueChange={(val) => setLocation(val === '__all__' ? '' : val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="__all__" className="text-white">All locations</SelectItem>
                            {locations.map((loc) => (
                              <SelectItem key={loc} value={loc} className="text-white">
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Source</Label>
                        <Select
                          value={sourceFilter}
                          onValueChange={(val) => setSourceFilter(val)}
                        >
                          <SelectTrigger className="border-white/20 bg-white/5 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                            <SelectItem value="both" className="text-white">Both (Database + Marketplace)</SelectItem>
                            <SelectItem value="database" className="text-white">Database Only</SelectItem>
                            <SelectItem value="marketplace" className="text-white">Marketplace Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </motion.div>

          {/* Results Section */}
          <div id="results-section">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && results && (
              <>
                {/* Results Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl md:text-3xl font-bold text-white"
                    >
                      Found{' '}
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-[#5B7FFF]"
                      >
                        {(results?.total || 0).toLocaleString()}
                      </motion.span>{' '}
                      cars
                    </motion.h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                    {selectedCars.size > 0 && (
                      <Button
                        onClick={handleCompareSelected}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm md:text-base"
                        size="sm"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Compare Selected </span>
                        <span>({selectedCars.size})</span>
                      </Button>
                    )}

                    <div className="flex items-center gap-1 md:gap-2 border border-white/20 rounded-lg p-1 bg-white/5">
                      <Button
                        onClick={() => setViewMode('grid')}
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className={`${viewMode === 'grid' ? 'bg-[#5B7FFF] text-white' : 'text-white hover:bg-white/10'} h-8 w-8 p-0`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setViewMode('list')}
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className={`${viewMode === 'list' ? 'bg-[#5B7FFF] text-white' : 'text-white hover:bg-white/10'} h-8 w-8 p-0`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>

                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                      <SelectTrigger className="w-full sm:w-[180px] border-white/20 bg-white/5 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
                        <SelectItem value="best_deals" className="text-white">Best Deals</SelectItem>
                        <SelectItem value="price_low" className="text-white">Price: Low → High</SelectItem>
                        <SelectItem value="price_high" className="text-white">Price: High → Low</SelectItem>
                        <SelectItem value="year_new" className="text-white">Year: Newest</SelectItem>
                        <SelectItem value="mileage_low" className="text-white">Mileage: Lowest</SelectItem>
                      </SelectContent>
                    </Select>

                    {isAuthenticated && results && results.total > 0 && (
                      <Button
                        onClick={() => setSaveSearchDialogOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save this search
                      </Button>
                    )}
                  </div>
                </motion.div>

                {/* AI-Enhanced Recommendations (only show when budget is set) */}
                {budget && budget > 0 && sortedResults.length > 0 && (
                  <div className="mb-8 space-y-6">
                    {/* Best Value Section */}
                    {sortedResults.filter(c => c.price <= budget && c.price >= budget * 0.9).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className="h-6 w-6 text-green-400" />
                          <h3 className="text-xl font-bold text-white">Best Value for Your Budget</h3>
                        </div>
                        <p className="text-white/70 mb-4 text-sm">
                          Top cars within your budget with the best price-to-quality ratio
                        </p>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {sortedResults
                            .filter(c => c.price <= budget && c.price >= budget * 0.9)
                            .slice(0, 5)
                            .map((car, idx) => (
                              <Card key={`best-${idx}`} className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                  <div className="text-sm font-semibold text-white mb-1">
                                    {car.make} {car.model}
                                  </div>
                                  <div className="text-lg font-bold text-green-400">
                                    {formatCurrency(car.price)}
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    {car.year} • {formatNumber(car.mileage)} km
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Slightly Over Budget */}
                    {sortedResults.filter(c => c.price > budget && c.price <= budget * 1.15).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-lg p-6"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-6 w-6 text-orange-400" />
                          <h3 className="text-xl font-bold text-white">Worth Stretching Your Budget</h3>
                        </div>
                        <p className="text-white/70 mb-4 text-sm">
                          Great deals just slightly over your budget - worth considering
                        </p>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {sortedResults
                            .filter(c => c.price > budget && c.price <= budget * 1.15)
                            .slice(0, 5)
                            .map((car, idx) => (
                              <Card key={`over-${idx}`} className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                  <div className="text-sm font-semibold text-white mb-1">
                                    {car.make} {car.model}
                                  </div>
                                  <div className="text-lg font-bold text-orange-400">
                                    {formatCurrency(car.price)}
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    +{formatCurrency(car.price - budget)} over budget
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Save Money */}
                    {sortedResults.filter(c => c.price < budget * 0.9 && c.price >= budget * 0.7).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-6"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingDown className="h-6 w-6 text-blue-400" />
                          <h3 className="text-xl font-bold text-white">Save Money Alternatives</h3>
                        </div>
                        <p className="text-white/70 mb-4 text-sm">
                          Quality cars below your budget - save money without compromising
                        </p>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {sortedResults
                            .filter(c => c.price < budget * 0.9 && c.price >= budget * 0.7)
                            .slice(0, 5)
                            .map((car, idx) => (
                              <Card key={`save-${idx}`} className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                  <div className="text-sm font-semibold text-white mb-1">
                                    {car.make} {car.model}
                                  </div>
                                  <div className="text-lg font-bold text-blue-400">
                                    {formatCurrency(car.price)}
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    Save {formatCurrency(budget - car.price)}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {results.error ? (
                  <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-xl">
                    <CardContent className="py-12 text-center">
                      <p className="text-red-400 font-semibold mb-2">Error Loading Data</p>
                      <p className="text-white/70">{results.error}</p>
                      <p className="text-white/50 text-sm mt-4">Please check if data/iqcars_cleaned.csv exists and the backend server is running.</p>
                    </CardContent>
                  </Card>
                ) : !results.results || !Array.isArray(results.results) || results.results.length === 0 ? (
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardContent className="py-12 text-center text-white">
                      <p className="mb-2">{(t && typeof t === 'function' ? t('noResults') : null) || 'No results found'}</p>
                      <p className="text-white/50 text-sm">Try adjusting your filters or budget range</p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-white/30 text-xs mt-2">
                          Debug: Total={results.total}, Results array length={results.results?.length || 0}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : sortedResults.length === 0 ? (
                  <Card className="border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl">
                    <CardContent className="py-12 text-center text-white">
                      <p className="mb-2 text-yellow-400">Results found but failed to process</p>
                      <p className="text-white/50 text-sm">Please try refreshing the page</p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-white/30 text-xs mt-2">
                          Debug: Total={results.total}, Results={results.results?.length || 0}, Sorted={sortedResults.length}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : loading ? (
                  <div className={viewMode === 'grid'
                    ? 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                  }>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ListingCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className={viewMode === 'grid'
                    ? 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                  }>
                    <AnimatePresence mode="popLayout">
                      {sortedResults.map((car, index) => {
                        if (!car || typeof car !== 'object') {
                          return null
                        }
                        
                        try {
                          const badges = getDealBadges(car, index)
                          const priceDiff = avgPrice > 0 && car.price ? ((car.price - avgPrice) / avgPrice) * 100 : 0
                          const carType = getCarType(car.model || 'Sedan')

                          // Get car image URL - prioritize marketplace image_url, fallback to database image_filename
                          let carImageUrl: string | null = null
                          if (car.image_url) {
                            if (car.image_url.startsWith('http')) {
                              carImageUrl = car.image_url
                            } else {
                              const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
                              carImageUrl = `${baseUrl}${car.image_url.startsWith('/') ? '' : '/'}${car.image_url}`
                            }
                          } else if (car.image_filename) {
                            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
                            carImageUrl = `${baseUrl}/api/car-images/${car.image_filename}`
                          }

                          return (
                            <motion.div
                              key={`${car.source || 'database'}-${car.listing_id || car.make || 'car'}-${car.model || 'unknown'}-${car.year || 'unknown'}-${index}`}
                              layout
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: (index % 20) * 0.05 }}
                              whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            >
                            <Card className={`border-white/10 bg-white/5 backdrop-blur-xl hover:border-[#5B7FFF]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#5B7FFF]/20 ${
                              viewMode === 'list' ? 'flex flex-row' : ''
                            }`}>
                              {/* Car Image — full width top, rounded; Favorite overlay top-right */}
                              {viewMode === 'grid' && (
                                <div className="relative w-full aspect-[16/10] rounded-t-2xl overflow-hidden bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20">
                                  {carImageUrl ? (
                                    <Image
                                      src={carImageUrl}
                                      alt={`${car.make} ${car.model} ${car.year}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <Car
                                      className="h-24 w-24 opacity-50 absolute inset-0 m-auto"
                                      style={{ color: getCarIconColor(car.make) }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  {/* Favorite (❤) top-right overlay */}
                                  <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 flex gap-2">
                                    {badges.some(b => b.label === 'Best Deal') && (
                                      <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-white/20 text-xs">Best Deal</Badge>
                                    )}
                                    {car.is_new && (
                                      <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-white/20 text-xs">New</Badge>
                                    )}
                                    <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px] bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm" onClick={() => toggleFavorite(index)} aria-label="Favorite">
                                      <Heart className={`h-5 w-5 ${favorites.has(index) ? 'fill-red-500 text-red-500' : ''}`} />
                                    </Button>
                                  </div>
                                  <div className="absolute bottom-2 left-2 flex gap-2">
                                    <Badge className={`backdrop-blur-sm text-white border-white/20 ${
                                      car.source === 'marketplace' 
                                        ? 'bg-purple-500/90' 
                                        : 'bg-blue-500/90'
                                    }`}>
                                      {car.source === 'marketplace' ? 'Marketplace' : 'Database'}
                                    </Badge>
                                    <Badge className="bg-black/40 backdrop-blur-sm text-white border-white/20">
                                      {carType}
                                    </Badge>
                                  </div>
                                </div>
                              )}

                              {/* List View Image */}
                              {viewMode === 'list' && (
                                <div className="relative w-full sm:w-48 h-48 bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {carImageUrl ? (
                                    <Image
                                      src={carImageUrl}
                                      alt={`${car.make} ${car.model} ${car.year}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 100vw, 192px"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <Car
                                      className="h-16 w-16 opacity-50"
                                      style={{ color: getCarIconColor(car.make) }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  {car.is_new && (
                                    <Badge className="absolute top-2 left-2 bg-green-500/90 text-white text-xs">
                                      New
                                    </Badge>
                                  )}
                                  <Badge className={`absolute top-2 right-2 text-white text-xs ${
                                    car.source === 'marketplace' 
                                      ? 'bg-purple-500/90' 
                                      : 'bg-blue-500/90'
                                  }`}>
                                    {car.source === 'marketplace' ? 'Marketplace' : 'Database'}
                                  </Badge>
                                </div>
                              )}

                              <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <CardTitle className="text-white text-lg font-bold">
                                        {car?.make || 'Unknown'} {car?.model || ''}
                                      </CardTitle>
                                      {viewMode === 'grid' && car.is_new && (
                                        <Badge className="bg-green-500/90 text-white text-xs">
                                          New
                                        </Badge>
                                      )}
                                      {viewMode === 'grid' && (
                                        <Badge className={`text-white text-xs ${
                                          car.source === 'marketplace' 
                                            ? 'bg-purple-500/90' 
                                            : 'bg-blue-500/90'
                                        }`}>
                                          {car.source === 'marketplace' ? 'Marketplace' : 'Database'}
                                        </Badge>
                                      )}
                                    </div>
                                    <CardDescription className="text-white/70">
                                      {car?.year || 'N/A'} • {formatNumber(car?.mileage || 0)} km
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-2">
                                    {viewMode === 'list' && (
                                      <>
                                        {car.is_new && (
                                          <Badge className="bg-green-500/90 text-white text-xs">
                                            New
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-white hover:bg-white/10"
                                          onClick={() => toggleFavorite(index)}
                                        >
                                          <Heart className={`h-4 w-4 ${favorites.has(index) ? 'fill-red-500 text-red-500' : ''}`} />
                                        </Button>
                                      </>
                                    )}
                                    <Checkbox
                                      checked={selectedCars.has(index)}
                                      onCheckedChange={() => toggleCarSelection(index)}
                                      className="border-white/30 data-[state=checked]:bg-[#5B7FFF] data-[state=checked]:border-[#5B7FFF]"
                                      aria-label={`Add ${car.make} ${car.model} to comparison`}
                                    />
                                  </div>
                                </div>

                                {/* Badges */}
                                {badges.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {badges.map((badge, idx) => (
                                      <Badge
                                        key={idx}
                                        className={`${badge.color} border backdrop-blur-sm text-xs`}
                                      >
                                        {badge.label}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardHeader>

                              <CardContent className={viewMode === 'list' ? 'flex-1' : ''}>
                                <div className="space-y-3">
                                  {/* Price with gradient */}
                                  <div className="p-4 bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20 rounded-lg border border-[#5B7FFF]/30">
                                    <div className="text-sm text-white/70 mb-1">Price</div>
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-2xl sm:text-3xl font-bold text-white"
                                    >
                                      {formatCurrency(car?.price || 0)}
                                    </motion.div>
                                    {car.price_difference !== undefined && car.price_difference > 0 && (
                                      <div className="text-sm text-blue-400 mt-1">
                                        ${car.price_difference.toFixed(0)} from budget
                                      </div>
                                    )}
                                    {priceDiff < -5 && (
                                      <div className="text-sm text-green-400 mt-1 flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" />
                                        {Math.abs(priceDiff || 0).toFixed(1)}% below market
                                      </div>
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-white/80">
                                      <MapPin className="h-4 w-4 text-[#5B7FFF]" />
                                      {car?.location || 'Unknown'}
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80">
                                      <Gauge className="h-4 w-4 text-[#5B7FFF]" />
                                      {formatNumber(car?.mileage || 0)} km
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-white/80">
                                      <div>
                                        <span className="font-semibold">Condition:</span> {car?.condition || 'N/A'}
                                      </div>
                                      <div>
                                        <span className="font-semibold">Fuel:</span> {car?.fuel_type || 'N/A'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    {car.source === 'marketplace' && car.listing_id ? (
                                      <>
                                        <Button
                                          onClick={() => {
                                            router.push(`/${locale}/buy-sell/${car.listing_id}`)
                                          }}
                                          className="flex-1 bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] hover:from-[#5B7FFF]/90 hover:to-[#8B5CF6]/90 text-white hover:shadow-lg hover:shadow-[#5B7FFF]/50 transition-all duration-300"
                                        >
                                          View Details
                                          <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                        {comparisonCars.length < 3 && (
                                          <Button
                                            onClick={() => toggleCarSelection(index)}
                                            variant="outline"
                                            className={`border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white min-h-[44px] min-w-[44px] ${
                                              selectedCars.has(index) ? 'bg-[#5B7FFF]/20 border-[#5B7FFF]' : ''
                                            }`}
                                            aria-label={`Add ${car.make} ${car.model} to comparison`}
                                            title="Add to comparison"
                                          >
                                            <GitCompare className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <Button
                                        onClick={() => {
                                          try {
                                            handleUseCar(car)
                                          } catch (error) {
                                            console.error('Error handling use car:', error)
                                          }
                                        }}
                                        className="flex-1 bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] hover:from-[#5B7FFF]/90 hover:to-[#8B5CF6]/90 text-white hover:shadow-lg hover:shadow-[#5B7FFF]/50 transition-all duration-300"
                                      >
                                        Use This Car
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                          )
                        } catch (error) {
                          console.error('Error rendering car card at index', index, error, car)
                          return null
                        }
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pagination */}
                {results && results.total && results.page_size && results.total > results.page_size && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 flex flex-col items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          handleSearch(currentPage - 1)
                          if (typeof window !== 'undefined') {
                            try {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            } catch (error) {
                              console.error('Scroll error:', error)
                            }
                          }
                        }}
                        disabled={currentPage === 1 || loading}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      >
                        Previous
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, Math.ceil((results?.total || 0) / (results?.page_size || 20))) }, (_, i) => {
                          const totalPages = Math.ceil((results?.total || 0) / (results?.page_size || 20))
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              onClick={() => {
                                handleSearch(pageNum)
                                if (typeof window !== 'undefined') {
                            try {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            } catch (error) {
                              console.error('Scroll error:', error)
                            }
                          }
                              }}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              className={
                                currentPage === pageNum
                                  ? 'bg-[#5B7FFF] text-white'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                              }
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        onClick={() => {
                          handleSearch(currentPage + 1)
                          if (typeof window !== 'undefined') {
                            try {
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            } catch (error) {
                              console.error('Scroll error:', error)
                            }
                          }
                        }}
                        disabled={currentPage >= Math.ceil((results?.total || 0) / (results?.page_size || 20)) || loading}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      >
                        Next
                      </Button>
                    </div>

                    <div className="text-white/70 text-sm">
                      Page {currentPage} of {Math.ceil((results?.total || 0) / (results?.page_size || 20))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Save This Search</DialogTitle>
            <DialogDescription className="text-gray-400">
              Give your search a name and we&apos;ll notify you when new cars match your criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Search Name</Label>
              <Input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Red SUVs under $20k"
                className="bg-gray-700 border-gray-600 text-white mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchName.trim()) {
                    handleSaveSearch()
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-400">
              <p className="mb-2">Search criteria:</p>
              <ul className="list-disc list-inside space-y-1">
                {minPrice > 0 && <li>Min price: ${minPrice.toLocaleString()}</li>}
                {maxPrice < 200000 && <li>Max price: ${maxPrice.toLocaleString()}</li>}
                {selectedMake && <li>Make: {selectedMake}</li>}
                {selectedModel && <li>Model: {selectedModel}</li>}
                {minYear > 2010 && <li>Min year: {minYear}</li>}
                {maxYear < 2025 && <li>Max year: {maxYear}</li>}
                {maxMileage < 200000 && <li>Max mileage: {maxMileage.toLocaleString()} km</li>}
                {condition && <li>Condition: {condition}</li>}
                {fuelType && <li>Fuel type: {fuelType}</li>}
                {location && <li>Location: {location}</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveSearchDialogOpen(false)
                setSearchName('')
              }}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSearch}
              disabled={!searchName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile: sticky bottom bar — Reset + Find Cars (always visible) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/95 backdrop-blur-xl border-t border-white/10 md:hidden">
        <Button onClick={handleReset} variant="outline" className="flex-1 min-h-[44px] border-white/20 bg-white/5 hover:bg-white/10 text-white">
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={() => handleSearch(1)} disabled={loading} className="flex-1 min-h-[44px] bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {(t && typeof t === 'function' ? t('findCars') : null) || 'Find Cars'}
        </Button>
      </div>

      {/* Comparison Bar */}
      <ComparisonBar
        selectedCars={comparisonCars}
        onRemove={(id) => {
          setComparisonCars(prev => prev.filter(c => c.id !== id))
          // Also remove from selectedCars set
          const indexToRemove = sortedResults.findIndex((car, idx) => {
            const carId = car.listing_id || car.make + car.model + car.year + idx
            return carId === id
          })
          if (indexToRemove !== -1) {
            const newSelected = new Set(selectedCars)
            newSelected.delete(indexToRemove)
            setSelectedCars(newSelected)
          }
        }}
        onClear={() => {
          setComparisonCars([])
          setSelectedCars(new Set())
        }}
      />
    </div>
  )
}
