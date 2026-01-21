"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PredictionForm } from '@/components/prediction/PredictionForm'
import { PredictionResult } from '@/components/prediction/PredictionResult'
import { PredictionResultSkeleton } from '@/components/prediction/PredictionResultSkeleton'
import { LoadingAnimation } from '@/components/prediction/LoadingAnimation'
import { apiClient } from '@/lib/api'
import type { CarFeatures, PredictionResponse } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Car } from 'lucide-react'
import { addRecentSearch } from '@/lib/recent-searches'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getCarPreviewImage } from '@/lib/carImageMap'
import { Badge } from '@/components/ui/badge'
import { useImageCache } from '@/hooks/use-image-cache'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { usePredictLoading } from '@/components/PredictLoadingProvider'
import { cn } from '@/lib/utils'

// Image upload constants (kept for image analysis functionality)
const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Car Preview Image Component
 * Always renders a real car image (JPG) - never shows empty placeholder or SVG
 */
function CarPreviewImage({
  imagePreviews,
  carFeatures,
  carImagePath,
  previewImage
}: {
  imagePreviews: string[]
  carFeatures: CarFeatures
  carImagePath?: string
  previewImage?: string
}) {
  const imageCache = useImageCache()

  // Compute preview image source BEFORE render - ALWAYS resolve to a valid JPG path
  const previewImageSrc = useMemo(() => {
    // Priority 1: Use uploaded image if available
    if (imagePreviews.length > 0 && imagePreviews[0]) {
      return imagePreviews[0]
    }

    // Priority 2: Use preview_image URL from prediction result (real dataset image)
    if (previewImage && previewImage.trim()) {
      return previewImage.trim()
    }

    // Priority 3: Use car image from prediction result (car_images folder)
    if (carImagePath) {
      // Check cache first to prevent 429 errors
      const cachedUrl = imageCache.getCachedUrl(carImagePath)
      if (cachedUrl) {
        return cachedUrl
      }

      // carImagePath is like "car_000000.jpg" - serve from backend API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const backendImageUrl = `${apiBaseUrl}/api/car-images/${carImagePath}`

      // Cache the URL before returning (prevents duplicate requests)
      imageCache.setCachedUrl(carImagePath, backendImageUrl)
      return backendImageUrl
    }

    // Priority 4: Use carImageMap lookup with car details (includes trim)
    const mappedImage = getCarPreviewImage({
      make: carFeatures.make || '',
      model: carFeatures.model || '',
      year: carFeatures.year,
      trim: carFeatures.trim,
    })

    // CRITICAL: Ensure we NEVER use SVG - force JPG fallback
    let finalPath = mappedImage || '/images/cars/default-car.jpg'

    // Replace any .svg with .jpg (safety check)
    if (finalPath.endsWith('.svg')) {
      finalPath = finalPath.replace(/\.svg$/, '.jpg')
      // If still no match, use default
      if (finalPath === mappedImage) {
        finalPath = '/images/cars/default-car.jpg'
      }
    }

    // Cache static image paths to prevent unnecessary requests
    if (finalPath.startsWith('/images/')) {
      const cachedUrl = imageCache.getCachedUrl(finalPath)
      if (cachedUrl) {
        return cachedUrl
      }
      imageCache.setCachedUrl(finalPath, finalPath)
    }

    return finalPath
  }, [imagePreviews, carFeatures.make, carFeatures.model, carFeatures.year, carFeatures.trim, carImagePath, previewImage, imageCache])

  const [currentSrc, setCurrentSrc] = useState(previewImageSrc)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(previewImageSrc)
    setHasError(false)
  }, [previewImageSrc])

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/70">
        <Car className="h-12 w-12 text-white/60" />
      </div>
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={`${carFeatures.year} ${carFeatures.make} ${carFeatures.model}`}
      fill
      className="object-cover"
      loading="lazy"
      onError={() => {
        if (!currentSrc.includes('default-car.jpg')) {
          setCurrentSrc('/images/cars/default-car.jpg')
        } else {
          setHasError(true)
        }
      }}
      priority={false}
      unoptimized={true}
    />
  )
}

export default function PredictPage() {
  // All hooks must be called before any conditional returns
  const [mounted, setMounted] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [carFeatures, setCarFeatures] = useState<CarFeatures | null>(null)
  const [loading, setLoading] = useState(false)
  const [prefillData, setPrefillData] = useState<CarFeatures | null>(null)
  const [formFeatures, setFormFeatures] = useState<Partial<CarFeatures> | null>(null)
  const [predictionId, setPredictionId] = useState<number | undefined>(undefined)
  const resultsRef = useRef<HTMLDivElement>(null)
  // Image upload state
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [imageAnalysis, setImageAnalysis] = useState<{
    summary: string
    bullets: string[]
    guessed_make: string | null
    guessed_model: string | null
    guessed_color: string | null
    condition: string
    confidence: number
    image_features?: number[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hooks must be called unconditionally
  const t = useTranslations('predict')
  const tCommon = useTranslations('common')
  const toastHook = useToast()
  const toast = toastHook || { toast: () => { } }
  const { setPredicting } = usePredictLoading()

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Pulse atmospheric blobs when predicting
  useEffect(() => {
    setPredicting(loading)
    return () => setPredicting(false)
  }, [loading, setPredicting])

  // Check for prefill data from budget finder
  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const prefill = sessionStorage.getItem('prefillCar')
        if (prefill) {
          try {
            const data = JSON.parse(prefill)
            // Validate data structure
            if (data && typeof data === 'object' && data.make && data.model && data.year) {
              setPrefillData(data)
              sessionStorage.removeItem('prefillCar')
              // Show toast notification
              if (toast?.toast) {
                toast.toast({
                  title: tCommon?.('success') || 'Success',
                  description: `Car details loaded: ${data.make} ${data.model} (${data.year})`,
                })
              }
            }
          } catch (e) {
            // Invalid JSON, ignore
            console.error('Failed to parse prefill data:', e)
            sessionStorage.removeItem('prefillCar')
          }
        }
      } catch (error) {
        console.error('SessionStorage access error:', error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear images when form is cleared (formFeatures becomes null/empty)
  useEffect(() => {
    if (!formFeatures || (!formFeatures.make && !formFeatures.model)) {
      // Form was cleared, reset images
      if (images.length > 0 || imagePreviews.length > 0) {
        setImages([])
        setImagePreviews([])
        setImageAnalysis(null)
        setSelectedImageIndex(0)
      }
    }
  }, [formFeatures, images.length, imagePreviews.length])

  // Image upload handlers
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles: File[] = []
    const previewPromises: Promise<string>[] = []

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        if (toast?.toast) {
          toast.toast({
            title: 'Invalid file type',
            description: `${file.name} must be jpg, png, or webp`,
            variant: 'destructive',
          })
        }
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        if (toast?.toast) {
          toast.toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit`,
            variant: 'destructive',
          })
        }
        return
      }

      // Validate total count
      if (images.length + newFiles.length >= MAX_IMAGES) {
        if (toast?.toast) {
          toast.toast({
            title: 'Too many images',
            description: `Maximum ${MAX_IMAGES} images allowed`,
            variant: 'destructive',
          })
        }
        return
      }

      newFiles.push(file)
      const previewPromise = new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      })
      previewPromises.push(previewPromise)
    })

    if (newFiles.length > 0) {
      setImages((prev) => [...prev, ...newFiles])
      Promise.all(previewPromises).then((previews) => {
        setImagePreviews((prev) => [...prev, ...previews])
      })
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    if (selectedImageIndex >= images.length - 1 && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
    if (images.length === 1) {
      setImageAnalysis(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleImageUpload(e.dataTransfer.files)
  }

  const handlePredict = async (features: CarFeatures | null) => {
    // Validate input
    if (!features) {
      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: 'Invalid car features provided',
          variant: 'destructive',
        })
      }
      return
    }

    // Validate fuel_type before API call (extra safeguard)
    const validFuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']
    if (!features.fuel_type || !validFuelTypes.includes(features.fuel_type)) {
      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: `Invalid fuel type: ${features.fuel_type || 'undefined'}. Must be one of: ${validFuelTypes.join(', ')}`,
          variant: 'destructive',
        })
      }
      return
    }

    setLoading(true)
    setPrediction(null)
    setCarFeatures(features)
    setFormFeatures(features)
    setPredictionId(undefined) // Reset prediction ID when starting new prediction

    try {
      // If images exist, analyze them first to get image_features
      let imageFeatures: number[] | undefined = undefined
      if (images.length > 0) {
        try {
          const analysisResult = await apiClient.analyzeImages(images)
          if (analysisResult.success && analysisResult.data?.image_features) {
            imageFeatures = analysisResult.data.image_features
            setImageAnalysis(analysisResult.data)
          }
        } catch (imageError) {
          console.error('Image analysis failed:', imageError)
          // Continue with prediction without images
          if (toast?.toast) {
            toast.toast({
              title: 'Image analysis failed',
              description: 'Continuing with prediction without image features',
              variant: 'default',
            })
          }
        }
      }

      const result = await apiClient.predictPrice(features, imageFeatures)

      // Validate result
      if (!result || typeof result !== 'object' || typeof result.predicted_price !== 'number') {
        throw new Error('Invalid response from server')
      }

      setPrediction(result)

      // Save prediction to database for feedback tracking
      try {
        const saveResult = await apiClient.savePrediction({
          car_features: features,
          predicted_price: result.predicted_price,
          confidence_interval: result.confidence_interval,
          confidence_level: result.confidence_level,
          image_features: imageFeatures
        })
        if (saveResult && saveResult.success && saveResult.prediction_id) {
          setPredictionId(saveResult.prediction_id)
        }
      } catch (saveError) {
        // Error already handled in savePrediction, just continue
      }

      // Save to recent searches (with error handling)
      try {
        if (typeof window !== 'undefined' && features && result) {
          addRecentSearch(features, result)
        }
      } catch (storageError) {
        console.error('Failed to save recent search:', storageError)
        // Non-critical error, continue
      }

      // Smooth scroll to results (only on client)
      if (typeof window !== 'undefined' && resultsRef && resultsRef.current) {
        try {
          setTimeout(() => {
            try {
              if (resultsRef?.current) {
                resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

      // Only show toast if there's an important message
      if (result.message && typeof result.message === 'string' && result.message.toLowerCase().includes('warning')) {
        if (toast?.toast) {
          toast.toast({
            title: 'Note',
            description: result.message,
            variant: 'default',
          })
        }
      }
    } catch (error: unknown) {
      // Extract error message from API response
      let errorMessage = 'Failed to predict price'

      if (axios.isAxiosError(error)) {
        // Handle Axios errors (API errors)
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          errorMessage = detail.map((err: any) => {
            const field = err.loc?.join('.') || 'field'
            const msg = err.msg || 'Invalid value'
            return `${field}: ${msg}`
          }).join(', ')
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = (updates: Partial<CarFeatures> | null) => {
    if (!updates || typeof updates !== 'object') {
      return
    }
    if (carFeatures && typeof carFeatures === 'object') {
      try {
        const updated = { ...carFeatures, ...updates }
        setCarFeatures(updated)
        setFormFeatures(updated)
        // Optionally re-predict with updated features
      } catch (error) {
        console.error('Failed to update car features:', error)
      }
    }
  }

  // Clear form handler
  const handleClearForm = () => {
    setPrediction(null)
    setCarFeatures(null)
    setFormFeatures(null)
    setImages([])
    setImagePreviews([])
    setImageAnalysis(null)
    setSelectedImageIndex(0)
  }

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[60vh] w-full pt-6 pb-12 md:py-10 overflow-visible">
      {/* Simple page title (Hero stays on Home only) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          {(t && typeof t === 'function' ? t('title') : null) || 'Predict Car Price'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base sm:text-lg">
          {(t && typeof t === 'function' ? t('description') : null) || 'Enter car details to get an AI-powered price prediction'}
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${prediction ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Left: Form — centered wizard when no prediction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("relative z-10", !prediction && "max-w-2xl mx-auto w-full")}
        >
          <Card className="overflow-visible transition-all duration-300 group hover:border-white/20 relative">
            {/* Car silhouette watermark when form is empty (no prediction yet) */}
            {!prediction && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-[20px]" aria-hidden>
                <Car className="w-[280px] sm:w-[360px] h-auto text-indigo-500/[0.04] dark:text-indigo-400/[0.05]" strokeWidth={1} />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🚗
                </motion.span>
                Car Details
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-center">
                Fill in the form to get a price prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible relative z-10">
              <PredictionForm
                onSubmit={handlePredict}
                loading={loading}
                prefillData={prefillData}
                onFormChange={setFormFeatures}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Results - Only show after prediction */}
        {prediction && (
          <ErrorBoundary fallback={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-sm text-red-400">Failed to load prediction results. Please try again.</p>
            </motion.div>
          }>
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 lg:sticky lg:top-24 lg:self-start"
              id="results-section"
            >
              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Card className="hover-lift border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-xl">
                      <CardContent className="py-8">
                        <LoadingAnimation />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 space-y-2"
                        >
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-center text-sm text-[#94a3b8]"
                          >
                            Analyzing market data...
                          </motion.div>
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="text-center text-sm text-[#94a3b8]"
                          >
                            Comparing with similar vehicles...
                          </motion.div>
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            className="text-center text-sm text-[#94a3b8]"
                          >
                            Calculating optimal price...
                          </motion.div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence mode="wait">
                {carFeatures && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                  >
                    <ErrorBoundary fallback={
                      <Card className="border border-red-500/50 bg-red-500/10">
                        <CardContent className="p-6">
                          <p className="text-sm text-red-400">Failed to display prediction results. Please try again.</p>
                        </CardContent>
                      </Card>
                    }>
                      <PredictionResult
                        result={prediction}
                        carFeatures={carFeatures}
                        onUpdate={handleUpdate}
                        predictionId={predictionId}
                        carPreviewElement={
                          <Card className="hover-lift border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                            <CardHeader>
                              <CardTitle className="text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Car Preview
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <ErrorBoundary fallback={
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                  <Car className="h-12 w-12 text-white/60" />
                                </div>
                              }>
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                  <CarPreviewImage
                                    imagePreviews={imagePreviews}
                                    carFeatures={carFeatures}
                                    carImagePath={prediction?.car_image_path}
                                    previewImage={prediction?.preview_image}
                                  />
                                </div>
                              </ErrorBoundary>
                              <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-white">
                                  {carFeatures.year} {carFeatures.make} {carFeatures.model}
                                  {carFeatures.trim && carFeatures.trim !== '__none__' && ` ${carFeatures.trim}`}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  Based on details
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        }
                      />
                    </ErrorBoundary>

                    {/* Your Car Photos Card (only if multiple images uploaded - avoid duplicate) */}
                    {images.length > 1 && imagePreviews.length > 1 && (
                      <Card className="hover-lift border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Your Car Photos
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Main image display */}
                          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-white/5">
                            <Image
                              src={imagePreviews[selectedImageIndex]}
                              alt={`Car photo ${selectedImageIndex + 1}`}
                              fill
                              className="object-contain"
                              loading="lazy"
                            />
                          </div>

                          {/* Thumbnail grid */}
                          {imagePreviews.length > 1 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {imagePreviews.map((preview, index) => (
                                <div
                                  key={index}
                                  className={`relative aspect-square rounded overflow-hidden cursor-pointer border-2 transition-all ${index === selectedImageIndex
                                      ? 'border-white/60 ring-2 ring-white/40'
                                      : 'border-white/20 hover:border-white/40'
                                    }`}
                                  onClick={() => setSelectedImageIndex(index)}
                                >
                                  <Image
                                    src={preview}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* AI Analysis Bullets (optional) */}
                          {imageAnalysis && imageAnalysis.bullets && imageAnalysis.bullets.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <p className="text-sm text-white/80 mb-2">AI Image Analysis:</p>
                              <ul className="space-y-1">
                                {imageAnalysis.bullets.map((bullet, index) => (
                                  <li key={index} className="text-sm text-white/60 flex items-start gap-2">
                                    <span className="text-white/40">•</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}

