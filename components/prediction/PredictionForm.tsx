"use client"

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { SAMPLE_CAR, YEAR_RANGE, MILEAGE_RANGE, CONDITIONS, FUEL_TYPES } from '@/lib/constants'
import type { CarFeatures } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import { useApiCache } from '@/hooks/use-api-cache'
import { RotateCcw, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { FieldTooltip, FIELD_TOOLTIPS } from './FieldTooltip'

// Base schema - validation ranges will be updated dynamically
const carFormSchema = z.object({
  year: z.number().min(1900).max(2025),
  mileage: z.number().min(0).max(1000000),
  engine_size: z.number({ required_error: "Engine size is required" }).min(0.5, { message: "Engine size must be at least 0.5L" }).max(10.0, { message: "Engine size must be at most 10.0L" }),
  cylinders: z.number().min(2).max(12),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string({ required_error: "Trim is required" }).min(1, { message: "Please select a trim level" }),
  condition: z.string().min(1),
  fuel_type: z.string().min(1),
  location: z.string().min(1),
  color: z.string().optional(),
})

type CarFormValues = z.infer<typeof carFormSchema>

interface PredictionFormProps {
  onSubmit: (data: CarFeatures) => void
  loading?: boolean
  prefillData?: CarFeatures | null
  onFormChange?: (data: Partial<CarFeatures> | null) => void
}

export function PredictionForm({ onSubmit, loading = false, prefillData = null, onFormChange }: PredictionFormProps) {
  const t = useTranslations('predict.form')
  const { toast } = useToast()
  const [makes, setMakes] = useState<string[]>([])
  const [modelsByMake, setModelsByMake] = useState<Record<string, string[]>>({}) // Cache all models by make
  const [models, setModels] = useState<string[]>([]) // Filtered models for current make
  const [trims, setTrims] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>(CONDITIONS)
  const [fuelTypes, setFuelTypes] = useState<string[]>(FUEL_TYPES)
  const [yearRange, setYearRange] = useState(YEAR_RANGE)
  const [mileageRange, setMileageRange] = useState(MILEAGE_RANGE)
  const [selectedMake, setSelectedMake] = useState<string>(SAMPLE_CAR.make || '')
  const [selectedModel, setSelectedModel] = useState<string>(SAMPLE_CAR.model || '')
  const [allEngineSizes, setAllEngineSizes] = useState<Array<{ size: number; display: string }>>([])
  const [availableEngines, setAvailableEngines] = useState<Array<{ size: number; display: string }>>([])
  const [availableCylinders, setAvailableCylinders] = useState<number[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [initialLoading, setInitialLoading] = useState(true) // Only show loading on initial page load
  const [loadingTrims, setLoadingTrims] = useState(false)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [loadingEngines, setLoadingEngines] = useState(false)
  const [loadingCylinders, setLoadingCylinders] = useState(false)
  const [loadingColors, setLoadingColors] = useState(false)
  const [loadingFuelTypes, setLoadingFuelTypes] = useState(false)

  // API cache for options endpoints
  const optionsCache = useApiCache<any>(5 * 60 * 1000) // 5 minute cache
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: prefillData ? {
      year: prefillData.year,
      mileage: prefillData.mileage,
      engine_size: prefillData.engine_size,
      cylinders: prefillData.cylinders,
      make: prefillData.make,
      model: prefillData.model,
      trim: prefillData.trim || '',
      condition: prefillData.condition as any,
      fuel_type: prefillData.fuel_type as any,
      location: prefillData.location,
      color: prefillData.color || '',
    } : {
      year: SAMPLE_CAR.year,
      mileage: SAMPLE_CAR.mileage,
      engine_size: SAMPLE_CAR.engine_size,
      cylinders: SAMPLE_CAR.cylinders,
      make: SAMPLE_CAR.make,
      model: SAMPLE_CAR.model,
      trim: '',
      condition: SAMPLE_CAR.condition as any,
      fuel_type: SAMPLE_CAR.fuel_type as any,
      location: SAMPLE_CAR.location,
      color: '',
    },
  })

  // Watch form values for car preview
  const makeValue = form.watch('make')
  const modelValue = form.watch('model')
  const yearValue = form.watch('year')
  const engineSizeValue = form.watch('engine_size')

  // Debounce make/model changes to prevent excessive API calls (increased to 1000ms)
  const debouncedMake = useDebounce(makeValue, 1000)
  const debouncedModel = useDebounce(modelValue, 1000)
  const debouncedEngineSize = useDebounce(engineSizeValue, 1000)

  // Load all engine sizes on mount
  useEffect(() => {
    const loadAllEngineSizes = async () => {
      try {
        const engines = await apiClient.getAllEngineSizes()
        setAllEngineSizes(engines)
        // If no engine size is set, use the first available or default
        if (!form.getValues('engine_size') && engines.length > 0) {
          form.setValue('engine_size', engines[0].size)
        }
      } catch (error) {
        console.error('Error loading all engine sizes:', error)
        // Use common engine sizes as fallback
        const commonSizes = [1.0, 1.2, 1.4, 1.5, 1.6, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0]
        setAllEngineSizes(commonSizes.map((size) => ({
          size,
          display: size === Math.floor(size) ? `${Math.floor(size)}L` : `${size}L`
        })))
      }
    }
    loadAllEngineSizes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load trims, engines, colors, and fuel types when make/model changes (debounced)
  useEffect(() => {
    // Cancel any pending requests
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()

    if (debouncedMake && debouncedModel && debouncedMake.trim() !== '' && debouncedModel.trim() !== '') {
      // Load trims first when make/model changes
      loadTrims(debouncedMake, debouncedModel)
      loadAvailableEngines(debouncedMake, debouncedModel)
      loadAvailableColors(debouncedMake, debouncedModel)
      loadAvailableFuelTypes(debouncedMake, debouncedModel)
    } else {
      // Use all engine sizes when make/model is not selected
      setAvailableEngines(allEngineSizes)
      setAvailableColors([])
      setTrims([])
      form.setValue('trim', '')
      form.clearErrors('trim')
      // Reset to all fuel types when make/model is not selected
      loadMetadata()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMake, debouncedModel, allEngineSizes])

  // Load cylinders when engine size changes (debounced)
  useEffect(() => {
    if (debouncedMake && debouncedModel && debouncedEngineSize && debouncedMake.trim() !== '' && debouncedModel.trim() !== '') {
      loadAvailableCylinders(debouncedMake, debouncedModel, debouncedEngineSize)
    } else {
      setAvailableCylinders([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMake, debouncedModel, debouncedEngineSize])

  // Notify parent of form changes
  useEffect(() => {
    if (onFormChange) {
      const values = form.getValues()
      if (values.make || values.model || values.year) {
        onFormChange({
          make: values.make,
          model: values.model,
          year: values.year,
        } as Partial<CarFeatures>)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeValue, modelValue, yearValue])

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      form.reset({
        year: prefillData.year,
        mileage: prefillData.mileage,
        engine_size: prefillData.engine_size,
        cylinders: prefillData.cylinders,
        make: prefillData.make,
        model: prefillData.model,
        trim: prefillData.trim || '',
        condition: prefillData.condition as any,
        fuel_type: prefillData.fuel_type as any,
        location: prefillData.location,
        color: prefillData.color || '',
      })
      setSelectedMake(prefillData.make)
      updateModelsForMake(prefillData.make)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData])

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      if (mounted) {
        setInitialLoading(true)
        // Load all makes and models once, locations, metadata, and engine sizes in parallel
        await Promise.all([
          loadAllMakesAndModels(),
          loadLocations(),
          loadMetadata()
        ])

        // After data is loaded, set up defaults
        if (mounted) {
          const defaultMake = SAMPLE_CAR.make || form.getValues('make')
          const defaultModel = SAMPLE_CAR.model || form.getValues('model')
          if (defaultMake && defaultMake.trim() !== '') {
            setSelectedMake(defaultMake)
            updateModelsForMake(defaultMake)
            // Load trims if default model also exists
            if (defaultModel && defaultModel.trim() !== '') {
              setSelectedModel(defaultModel)
              await loadTrims(defaultMake, defaultModel)
            }
          }
          // Ensure engine sizes are available even if make/model not selected
          if (allEngineSizes.length > 0) {
            setAvailableEngines(allEngineSizes)
          }
          setInitialLoading(false)
        }
      }
    }
    loadData()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update models when make changes (local filtering, no API call)
  useEffect(() => {
    if (selectedMake) {
      updateModelsForMake(selectedMake)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMake, modelsByMake])

  const loadMetadata = async () => {
    setLoadingMetadata(true)
    try {
      const metadata = await apiClient.getMetadata()
      if (metadata.conditions.length > 0) {
        setConditions(metadata.conditions)
      }
      if (metadata.fuel_types.length > 0) {
        setFuelTypes(metadata.fuel_types)
      }
      if (metadata.year_range) {
        setYearRange(metadata.year_range)
      }
      if (metadata.mileage_range) {
        setMileageRange(metadata.mileage_range)
      }
    } catch (error) {
      // Use defaults from constants - silent fail
    } finally {
      setLoadingMetadata(false)
    }
  }

  // Load all makes and models once on mount
  const loadAllMakesAndModels = async () => {
    try {
      const makesList = await apiClient.getMakes()
      setMakes(makesList.length > 0 ? makesList : [])

      // Load models for all makes in parallel
      const modelsPromises = makesList.map(async (make) => {
        try {
          const modelsList = await apiClient.getModels(make)
          return { make, models: modelsList }
        } catch (error) {
          return { make, models: [] }
        }
      })

      const modelsResults = await Promise.all(modelsPromises)
      const modelsCache: Record<string, string[]> = {}
      modelsResults.forEach(({ make, models }) => {
        modelsCache[make] = models
      })

      setModelsByMake(modelsCache)

      // Set initial models if default make exists
      const defaultMake = SAMPLE_CAR.make || form.getValues('make')
      if (defaultMake && modelsCache[defaultMake]) {
        setModels(modelsCache[defaultMake])
      }
    } catch (error) {
      setMakes([])
      setModelsByMake({})
    }
  }

  // Filter models locally based on selected make (no API call)
  const updateModelsForMake = (make: string) => {
    if (!make || make.trim() === '') {
      setModels([])
      return
    }

    const cachedModels = modelsByMake[make] || []
    setModels(cachedModels)

    // Clear model selection when make changes
    form.setValue('model', '')
    setSelectedModel('')
    setTrims([])
    form.setValue('trim', '')
    form.clearErrors('trim')
    form.setValue('trim', '')
    form.clearErrors('trim')
  }

  const loadTrims = async (make: string, model: string) => {
    // Prevent multiple simultaneous calls
    if (loadingTrims || !make || !model || make.trim() === '' || model.trim() === '') {
      setTrims([])
      form.setValue('trim', '')
      form.clearErrors('trim')
      return
    }

    const cacheKey = `trims:${make}:${model}`
    
    // Cancel any pending request for this key
    const existingController = abortControllersRef.current.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const abortController = new AbortController()
    abortControllersRef.current.set(cacheKey, abortController)

    setLoadingTrims(true)
    try {
      const trimsList = await optionsCache.getOrFetch(
        cacheKey,
        async () => {
          try {
            return await apiClient.getTrims(make, model)
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw error
            }
            throw error
          }
        }
      )

      if (abortController.signal.aborted) {
        return
      }

      if (trimsList.length > 0) {
        setTrims(trimsList)
        // Auto-select first trim if none selected or current trim not in list
        const currentTrim = form.getValues('trim')
        if (!currentTrim || !trimsList.includes(currentTrim)) {
          form.setValue('trim', trimsList[0])
          form.clearErrors('trim')
        }
      } else {
        setTrims([])
        form.setValue('trim', '')
        // Show error if no trims available
        form.setError('trim', {
          type: 'manual',
          message: `No trim variants found for ${make} ${model} in our dataset. Please contact support.`
        })
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error loading trims:', error)
      setTrims([])
      form.setValue('trim', '')
      form.setError('trim', {
        type: 'manual',
        message: 'Failed to load trim options. Please try again.'
      })
    } finally {
      abortControllersRef.current.delete(cacheKey)
      setLoadingTrims(false)
    }
  }

  const loadAvailableEngines = async (make: string, model: string) => {
    if (loadingEngines || !make || !model || make.trim() === '' || model.trim() === '') {
      // Use all engine sizes when make/model not selected
      setAvailableEngines(allEngineSizes)
      return
    }

    const cacheKey = `engines:${make}:${model}`
    
    // Cancel any pending request for this key
    const existingController = abortControllersRef.current.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const abortController = new AbortController()
    abortControllersRef.current.set(cacheKey, abortController)

    setLoadingEngines(true)
    try {
      const engines = await optionsCache.getOrFetch(
        cacheKey,
        async () => {
          try {
            return await apiClient.getAvailableEngines(make, model)
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw error
            }
            throw error
          }
        }
      )

      if (abortController.signal.aborted) {
        return
      }

      // If engines found for this make/model, use them; otherwise use all engine sizes
      if (engines.length > 0) {
        setAvailableEngines(engines)
        // If only one engine option, auto-select it
        if (engines.length === 1 && engines[0].size) {
          form.setValue('engine_size', engines[0].size)
          // Also load cylinders for this engine
          await loadAvailableCylinders(make, model, engines[0].size)
        }
      } else {
        // Fallback to all engine sizes if none found for this make/model
        setAvailableEngines(allEngineSizes)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error loading engines:', error)
      // Fallback to all engine sizes on error
      setAvailableEngines(allEngineSizes)
    } finally {
      abortControllersRef.current.delete(cacheKey)
      setLoadingEngines(false)
    }
  }

  const loadAvailableCylinders = async (make: string, model: string, engineSize: number) => {
    if (loadingCylinders || !make || !model || make.trim() === '' || model.trim() === '' || !engineSize) {
      setAvailableCylinders([])
      return
    }

    const cacheKey = `cylinders:${make}:${model}:${engineSize}`
    
    // Cancel any pending request for this key
    const existingController = abortControllersRef.current.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const abortController = new AbortController()
    abortControllersRef.current.set(cacheKey, abortController)

    setLoadingCylinders(true)
    try {
      const cylinders = await optionsCache.getOrFetch(
        cacheKey,
        async () => {
          try {
            return await apiClient.getAvailableCylinders(make, model, engineSize)
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw error
            }
            throw error
          }
        }
      )

      if (abortController.signal.aborted) {
        return
      }

      setAvailableCylinders(cylinders)

      // If only one cylinder option, auto-select it
      if (cylinders.length === 1 && cylinders[0]) {
        form.setValue('cylinders', cylinders[0])
      } else if (cylinders.length > 0 && !cylinders.includes(form.getValues('cylinders'))) {
        // If current value is not in available options, select first one
        if (cylinders[0]) {
          form.setValue('cylinders', cylinders[0])
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error loading cylinders:', error)
      setAvailableCylinders([4]) // Default to 4
    } finally {
      abortControllersRef.current.delete(cacheKey)
      setLoadingCylinders(false)
    }
  }

  const loadAvailableColors = async (make: string, model: string) => {
    if (loadingColors || !make || !model || make.trim() === '' || model.trim() === '') {
      setAvailableColors([])
      return
    }

    const cacheKey = `colors:${make}:${model}`
    
    // Cancel any pending request for this key
    const existingController = abortControllersRef.current.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const abortController = new AbortController()
    abortControllersRef.current.set(cacheKey, abortController)

    setLoadingColors(true)
    try {
      const colors = await optionsCache.getOrFetch(
        cacheKey,
        async () => {
          try {
            return await apiClient.getAvailableColors(make, model)
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw error
            }
            throw error
          }
        }
      )

      if (abortController.signal.aborted) {
        return
      }

      setAvailableColors(colors)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error loading colors:', error)
      // Use default colors
      setAvailableColors(['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Gold', 'Brown', 'Orange', 'Yellow', 'Purple', 'Beige', 'Other'])
    } finally {
      abortControllersRef.current.delete(cacheKey)
      setLoadingColors(false)
    }
  }

  const loadAvailableFuelTypes = async (make: string, model: string) => {
    if (!make || !model || make.trim() === '' || model.trim() === '') {
      // Reset to all fuel types from metadata when make/model is cleared
      try {
        const metadata = await optionsCache.getOrFetch('metadata', () => apiClient.getMetadata())
        if (metadata.fuel_types.length > 0) {
          setFuelTypes(metadata.fuel_types)
        }
      } catch (error) {
        // Use default fuel types
        setFuelTypes(FUEL_TYPES)
      }
      return
    }

    if (loadingFuelTypes) {
      return
    }

    const cacheKey = `fuelTypes:${make}:${model}`
    
    // Cancel any pending request for this key
    const existingController = abortControllersRef.current.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const abortController = new AbortController()
    abortControllersRef.current.set(cacheKey, abortController)

    setLoadingFuelTypes(true)
    try {
      const fuelTypesList = await optionsCache.getOrFetch(
        cacheKey,
        async () => {
          try {
            return await apiClient.getAvailableFuelTypes(make, model)
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw error
            }
            throw error
          }
        }
      )

      if (abortController.signal.aborted) {
        return
      }
      if (fuelTypesList.length > 0) {
        setFuelTypes(fuelTypesList)
        const currentFuelType = form.getValues('fuel_type')

        // If only one fuel type available, auto-select it
        if (fuelTypesList.length === 1) {
          form.setValue('fuel_type', fuelTypesList[0] as any)
        }
        // If current fuel type is not in the new list, reset it to the first available
        else if (currentFuelType && !fuelTypesList.includes(currentFuelType)) {
          form.setValue('fuel_type', fuelTypesList[0] as any)
        }
      } else {
        // Fallback to all fuel types if none found for this make/model
        try {
          const metadata = await optionsCache.getOrFetch('metadata', () => apiClient.getMetadata())
          if (metadata.fuel_types.length > 0) {
            setFuelTypes(metadata.fuel_types)
          } else {
            setFuelTypes(FUEL_TYPES)
          }
        } catch (error) {
          setFuelTypes(FUEL_TYPES)
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error loading fuel types:', error)
      // Fallback to all fuel types from metadata
      try {
        const metadata = await optionsCache.getOrFetch('metadata', () => apiClient.getMetadata())
        if (metadata.fuel_types.length > 0) {
          setFuelTypes(metadata.fuel_types)
        } else {
          setFuelTypes(FUEL_TYPES)
        }
      } catch (metaError) {
        setFuelTypes(FUEL_TYPES)
      }
    } finally {
      abortControllersRef.current.delete(cacheKey)
      setLoadingFuelTypes(false)
    }
  }

  const loadLocations = async () => {
    try {
      const locationsList = await apiClient.getLocations()
      // Fallback if API returned empty (e.g. cached stale, or backend edge case)
      const fallback = ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Dubai', 'California', 'Texas', 'New York']
      setLocations(locationsList?.length > 0 ? locationsList : fallback)
    } catch {
      const fallback = ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Dubai', 'California', 'Texas', 'New York']
      setLocations(fallback)
    }
  }

  const handleSubmit = (data: CarFormValues) => {
    // Validate fuel_type before submission
    const validFuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']
    const fuelType = String(data.fuel_type).trim()

    if (!validFuelTypes.includes(fuelType)) {
      // Show inline error and prevent submission
      form.setError('fuel_type', {
        type: 'manual',
        message: `Fuel type must be one of: ${validFuelTypes.join(', ')}`
      })
      return
    }

    // Clean the data before submission
    const cleanedData: CarFeatures = {
      ...data,
      // Trim is now required, ensure it's a valid string
      trim: String(data.trim).trim(),
      // Ensure all required fields are present and valid
      year: Number(data.year),
      mileage: Number(data.mileage),
      engine_size: Number(data.engine_size),
      cylinders: Number(data.cylinders),
      make: String(data.make).trim(),
      model: String(data.model).trim(),
      condition: String(data.condition).trim(),
      fuel_type: fuelType, // Use validated fuel type
      location: String(data.location).trim(),
      color: data.color && data.color.trim() !== '' ? String(data.color).trim() : undefined,
    }
    onSubmit(cleanedData)
  }

  const loadSampleCar = () => {
    form.reset({
      year: SAMPLE_CAR.year,
      mileage: SAMPLE_CAR.mileage,
      engine_size: SAMPLE_CAR.engine_size,
      cylinders: SAMPLE_CAR.cylinders,
      make: SAMPLE_CAR.make,
      model: SAMPLE_CAR.model,
      trim: SAMPLE_CAR.trim || '', // Use sample trim or empty (will be loaded by useEffect)
      condition: SAMPLE_CAR.condition as any,
      fuel_type: SAMPLE_CAR.fuel_type as any,
      location: SAMPLE_CAR.location,
      color: '',
    })
    setSelectedMake(SAMPLE_CAR.make)
    updateModelsForMake(SAMPLE_CAR.make)
    // Trim will be loaded automatically by useEffect when make/model are set
  }

  const clearForm = () => {
    form.reset()
    setSelectedMake('')
    setModels([])
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 overflow-visible relative">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('basicInfo')}</h3>
          <Badge variant="destructive" className="bg-red-500/20 text-red-400">MOST IMPORTANT</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.make}>
              <Label htmlFor="make">{t('make')}</Label>
            </FieldTooltip>
            <SearchableSelect
              value={form.watch('make') || ''}
              onValueChange={(value) => {
                if (value && value !== selectedMake) {
                  form.setValue('make', value)
                  setSelectedMake(value)
                  updateModelsForMake(value)
                }
              }}
              options={makes}
              placeholder={initialLoading ? "Loading..." : "Type to search makes..."}
              disabled={initialLoading}
              emptyMessage="No makes available"
              searchPlaceholder="Type to search..."
            />
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.model}>
              <Label htmlFor="model">{t('model')}</Label>
            </FieldTooltip>
            <SearchableSelect
              value={form.watch('model') || ''}
              onValueChange={(value) => {
                form.setValue('model', value)
                setSelectedModel(value)
                // Clear engine and cylinders when model changes
                setAvailableEngines([])
                setAvailableCylinders([])
                // Clear trim when model changes - it will be reloaded by useEffect
                form.setValue('trim', '')
                form.clearErrors('trim')
                setTrims([])
                // Trim will be loaded automatically by the useEffect hook when makeValue/modelValue update
              }}
              options={models}
              placeholder={!selectedMake ? "Select make first" : models.length > 0 ? "Type to search models..." : "No models available"}
              disabled={!selectedMake || initialLoading}
              emptyMessage={selectedMake ? `No models found for ${selectedMake}` : "Select a make first"}
              searchPlaceholder="Type to search..."
            />
          </motion.div>

          <motion.div
            className="space-y-2 sm:col-span-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.trim}>
              <Label htmlFor="trim">Trim <span className="text-red-400">*</span></Label>
            </FieldTooltip>
            <Select
              key={`trim-select-${selectedMake}-${selectedModel}`}
              value={form.watch('trim') || ''}
              onValueChange={(value) => {
                form.setValue('trim', value)
                form.clearErrors('trim')
              }}
              disabled={!selectedMake || !selectedModel || loadingTrims}
            >
              <SelectTrigger className={form.formState.errors.trim ? 'border-red-500' : ''}>
                <SelectValue placeholder={loadingTrims ? "Loading trims..." : selectedMake && selectedModel ? (trims.length > 0 ? "Select trim level" : "No trims available") : "Select make and model first"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {loadingTrims ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading trims...</div>
                ) : trims.length > 0 ? (
                  trims.map((trim) => (
                    <SelectItem key={trim} value={trim} className="text-white">
                      {trim}
                    </SelectItem>
                  ))
                ) : selectedMake && selectedModel ? (
                  <div className="p-2 text-center text-[#94a3b8] text-xs">
                    No trim variants found for {selectedMake} {selectedModel} in our dataset.
                  </div>
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">Select make and model first</div>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.trim && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.trim.message}
              </p>
            )}
            {!form.formState.errors.trim && selectedMake && selectedModel && trims.length > 0 && (
              <p className="text-xs text-[#94a3b8] mt-1">
                ℹ️ Trim level is required and affects price prediction.
              </p>
            )}
          </motion.div>

          <motion.div
            className="space-y-2 sm:col-span-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Label htmlFor="color">Color (Optional)</Label>
            <Select
              value={form.watch('color') || ''}
              onValueChange={(value) => {
                form.setValue('color', value || '')
              }}
              disabled={!selectedMake || !selectedModel || loadingColors}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingColors ? "Loading..." : "Select color (optional)"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {loadingColors ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading colors...</div>
                ) : availableColors.length > 0 ? (
                  availableColors.map((color) => (
                    <SelectItem key={color} value={color} className="text-white">
                      {color}
                    </SelectItem>
                  ))
                ) : selectedMake && selectedModel ? (
                  <div className="p-2 text-center text-[#94a3b8]">No colors available</div>
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">Select make and model first</div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#94a3b8] mt-1">
              ℹ️ Color is optional and does not affect price prediction.
            </p>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.year}>
              <Label htmlFor="year">{t('year')}: {form.watch('year')}</Label>
            </FieldTooltip>
            <Slider
              value={[form.watch('year')]}
              onValueChange={([value]) => form.setValue('year', value)}
              min={YEAR_RANGE.min}
              max={YEAR_RANGE.max}
              step={1}
              className="w-full"
            />
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.mileage}>
              <Label htmlFor="mileage">{t('mileage')}</Label>
            </FieldTooltip>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                id="mileage"
                type="number"
                className={`border-[#2a2d3a] bg-[#1a1d29] hover:border-indigo-500/50 focus:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all ${form.formState.errors.mileage ? 'animate-shake border-red-500' : ''
                  }`}
                {...form.register('mileage', { valueAsNumber: true })}
              />
            </motion.div>
            {form.formState.errors.mileage && (
              <p className="text-sm text-destructive">
                {form.formState.errors.mileage.message}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('technicalSpecs')}</h3>
          <Badge variant="warning">IMPORTANT</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.engine_size}>
              <Label htmlFor="engine_size">{t('engineSize')} <span className="text-red-400">*</span></Label>
            </FieldTooltip>
            <Select
              value={form.watch('engine_size') ? form.watch('engine_size').toString() : ''}
              onValueChange={(value) => {
                if (value && value !== '') {
                  const engineSize = parseFloat(value)
                  form.setValue('engine_size', engineSize)
                  // Clear any validation errors
                  form.clearErrors('engine_size')
                  // Load cylinders for selected engine if make/model are selected
                  if (selectedMake && selectedModel) {
                    loadAvailableCylinders(selectedMake, selectedModel, engineSize)
                  }
                }
              }}
              disabled={loadingEngines || (allEngineSizes.length === 0 && availableEngines.length === 0)}
            >
              <SelectTrigger className={form.formState.errors.engine_size ? 'border-red-500' : ''}>
                <SelectValue placeholder={loadingEngines ? "Loading..." : (allEngineSizes.length > 0 || availableEngines.length > 0) ? "Select engine size" : "Loading engine sizes..."} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {loadingEngines ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading engines...</div>
                ) : (availableEngines.length > 0 || allEngineSizes.length > 0) ? (
                  (availableEngines.length > 0 ? availableEngines : allEngineSizes).map((engine) => (
                    <SelectItem key={engine.size} value={engine.size.toString()} className="text-white">
                      {engine.display}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">No engine sizes available</div>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.engine_size && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.engine_size.message}
              </p>
            )}
            {!form.formState.errors.engine_size && (
              <p className="text-xs text-[#94a3b8] mt-1">
                ℹ️ Engine size is required and affects price prediction.
              </p>
            )}
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.cylinders}>
              <Label htmlFor="cylinders">{t('cylinders')}</Label>
            </FieldTooltip>
            <Select
              value={form.watch('cylinders') ? form.watch('cylinders').toString() : ''}
              onValueChange={(value) => {
                if (value && value !== '') {
                  form.setValue('cylinders', parseInt(value))
                }
              }}
              disabled={!selectedMake || !selectedModel || !engineSizeValue || loadingCylinders || availableCylinders.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCylinders ? "Loading..." : availableCylinders.length > 0 ? "Select cylinders" : selectedMake && selectedModel && engineSizeValue ? "No cylinders available" : "Select make, model, and engine first"} />
              </SelectTrigger>
              <SelectContent>
                {loadingCylinders ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading cylinders...</div>
                ) : availableCylinders.length > 0 ? (
                  availableCylinders.map((cyl) => (
                    <SelectItem key={cyl} value={cyl.toString()} className="text-white">
                      {cyl}
                    </SelectItem>
                  ))
                ) : selectedMake && selectedModel && engineSizeValue ? (
                  <div className="p-2 text-center text-[#94a3b8]">No cylinders found</div>
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">Select make, model, and engine first</div>
                )}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            className="space-y-2 sm:col-span-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.fuel_type}>
              <Label>{t('fuelType')}</Label>
            </FieldTooltip>
            <Select
              value={form.watch('fuel_type')}
              onValueChange={(value) => {
                form.setValue('fuel_type', value as any)
                // Clear error when user selects a valid value
                if (form.formState.errors.fuel_type) {
                  form.clearErrors('fuel_type')
                }
              }}
              disabled={!selectedMake || !selectedModel || loadingFuelTypes}
            >
              <SelectTrigger className={form.formState.errors.fuel_type ? 'border-red-500' : ''}>
                <SelectValue placeholder={loadingFuelTypes ? "Loading..." : selectedMake && selectedModel ? (fuelTypes.length > 0 ? "Select fuel type" : "No fuel types available") : "Select make and model first"} />
              </SelectTrigger>
              <SelectContent>
                {loadingFuelTypes ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading fuel types...</div>
                ) : fuelTypes.length > 0 ? (
                  fuelTypes.map((fuel) => (
                    <SelectItem key={fuel} value={fuel} className="text-white">
                      {fuel}
                    </SelectItem>
                  ))
                ) : selectedMake && selectedModel ? (
                  <div className="p-2 text-center text-[#94a3b8]">No fuel types found for {selectedMake} {selectedModel}</div>
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">Select make and model first</div>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.fuel_type && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.fuel_type.message}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Condition & Location */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('conditionLocation')}</h3>
          <Badge variant="warning">IMPORTANT</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.condition}>
              <Label>{t('condition')}</Label>
            </FieldTooltip>
            <Select
              value={form.watch('condition') || ''}
              onValueChange={(value) => form.setValue('condition', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition} value={condition} className="text-white">
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
          >
            <FieldTooltip content={FIELD_TOOLTIPS.location}>
              <Label htmlFor="location">{t('location')}</Label>
            </FieldTooltip>
            <Select
              key="location-select"
              value={form.watch('location') || ''}
              onValueChange={(value) => form.setValue('location', value)}
              disabled={initialLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={initialLoading ? "Loading locations..." : "Select location"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {initialLoading ? (
                  <div className="p-2 text-center text-[#94a3b8]">Loading locations...</div>
                ) : locations.length > 0 ? (
                  locations.map((location) => (
                    <SelectItem key={location} value={location} className="text-white">
                      {location}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-[#94a3b8]">No locations available</div>
                )}
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={loadSampleCar}
          className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
        >
          {t('trySample')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearForm}
          className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('clearForm')}
        </Button>
        <Button
          type="submit"
          disabled={loading || !form.formState.isValid}
          className="flex-1 bg-[#5B7FFF] hover:bg-[#4a6fe6] text-white shadow-lg shadow-[#5B7FFF]/30 hover:shadow-xl hover:shadow-[#5B7FFF]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Predicting...' : t('predictButton')}
        </Button>
      </div>
    </form>
  )
}

