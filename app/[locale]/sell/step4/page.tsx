"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useSellDraft } from '@/context/SellDraftContext'
import { Sparkles, CheckCircle2 } from 'lucide-react'

const COLOR_LABELS = ["Black", "White", "Silver", "Gray", "Blue", "Red", "Green", "Yellow", "Brown", "Beige", "Gold", "Orange"]

const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Other']
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other']
const FEATURES = [
  'Leather seats', 'Sunroof', 'Navigation', 'Backup camera', 'Bluetooth',
  'Heated seats', 'AWD/4WD', 'Cruise control', 'Keyless entry', 'Premium sound'
]

interface AISuggestion {
  value: string | number
  confidence: number
}

export default function SellStep4Page() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const { aiDetection, listingId, setCarDetails, location } = useSellDraft()
  type Step4Form = { mileage_unit: string; make?: string; model?: string; color?: string; year?: string; description?: string; [k: string]: unknown }
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step4Form>({
    defaultValues: {
      mileage_unit: 'km',
    }
  })

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<{
    make?: AISuggestion[]
    model?: AISuggestion[]
    color?: AISuggestion[]
    year?: AISuggestion[]
  }>({})
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('low')
  const [prefillLoaded, setPrefillLoaded] = useState(false)
  const [aiPrefilledValues, setAiPrefilledValues] = useState<{
    make?: string
    model?: string
    color?: string
    year?: string
  }>({})
  const [userOverrides, setUserOverrides] = useState<{
    make?: string
    model?: string
    color?: string
    year?: string
  }>({})
  const description = watch('description', '')

  // Load makes on mount
  useEffect(() => {
    const loadMakes = async () => {
      try {
        const makesList = await apiClient.getMakes()
        setMakes(makesList)
      } catch (error) {
        console.error('Failed to load makes:', error)
      }
    }
    loadMakes()
  }, [])

  // Load prefill and detection results (prefer SellDraftStore aiDetection)
  useEffect(() => {
    const loadPrefill = async () => {
      try {
        if (aiDetection) {
          if (aiDetection.make) setValue('make', aiDetection.make)
          if (aiDetection.model) setValue('model', aiDetection.model)
          if (aiDetection.color) setValue('color', aiDetection.color)
          setAiPrefilledValues({
            make: aiDetection.make,
            model: aiDetection.model,
            color: aiDetection.color,
          })
          setConfidenceLevel((aiDetection.confidence_label || 'LOW').toLowerCase() as 'high' | 'medium' | 'low')
          setPrefillLoaded(true)
          return
        }
        // Try to get from listing API (including edit mode)
        const sid = sessionStorage.getItem('sell_listing_id') || (listingId && String(listingId))
        if (sid) {
          const lid = parseInt(sid, 10)
          if (!isNaN(lid)) {
          try {
            const listing = await apiClient.getListing(lid)
            if (listing && (listing.make || listing.model || listing.price != null)) {
              setValue('make', listing.make || '')
              setValue('model', listing.model || '')
              setValue('year', listing.year != null ? String(listing.year) : '')
              setValue('trim', listing.trim || '')
              setValue('price', listing.price ?? '')
              setValue('mileage', listing.mileage ?? '')
              setValue('mileage_unit', listing.mileage_unit || 'km')
              setValue('condition', listing.condition || '')
              setValue('transmission', listing.transmission || '')
              setValue('fuel_type', listing.fuel_type || '')
              setValue('color', listing.color || '')
              setValue('description', listing.description || '')
              setSelectedFeatures(Array.isArray(listing.features) ? listing.features : [])
              setAiPrefilledValues({ make: listing.make, model: listing.model, color: listing.color, year: listing.year != null ? String(listing.year) : undefined })
              if (listing.auto_detect?.topk) {
                setAiSuggestions({
                  make: listing.auto_detect.topk.make || [],
                  model: listing.auto_detect.topk.model || [],
                  color: listing.auto_detect.topk.color || [],
                  year: listing.auto_detect.topk.year || [],
                })
              }
              setPrefillLoaded(true)
              return
            }
            if (listing?.prefill) {
              const prefill = listing.prefill
              if (prefill.make) setValue('make', prefill.make)
              if (prefill.model) setValue('model', prefill.model)
              if (prefill.color) setValue('color', prefill.color)
              if (prefill.year) setValue('year', prefill.year.toString())
              
              if (listing.auto_detect) {
                const detection = listing.auto_detect
                setAiSuggestions({
                  make: detection.topk?.make || [],
                  model: detection.topk?.model || [],
                  color: detection.topk?.color || [],
                  year: detection.topk?.year || [],
                })
                setConfidenceLevel(detection.meta?.confidence_level || 'low')
                setAiPrefilledValues({
                  make: prefill.make,
                  model: prefill.model,
                  color: prefill.color,
                  year: prefill.year?.toString()
                })
              }
              setPrefillLoaded(true)
              return
            }
          } catch (error) {
            console.error('Failed to load listing:', error)
          }
          }
        }
        
        // Fallback: load from sessionStorage
        const prefillData = sessionStorage.getItem('sell_prefill')
        const detectionData = sessionStorage.getItem('sell_detection')
        
        if (prefillData) {
          const prefill = JSON.parse(prefillData)
          if (prefill.make) setValue('make', prefill.make)
          if (prefill.model) setValue('model', prefill.model)
          if (prefill.color) setValue('color', prefill.color)
          if (prefill.year) setValue('year', prefill.year?.toString() || '')
        }
        
        if (detectionData) {
          const detection = JSON.parse(detectionData)
          // Load topk suggestions
          if (detection.topk) {
            setAiSuggestions({
              make: detection.topk.make || [],
              model: detection.topk.model || [],
              color: detection.topk.color || [],
              year: detection.topk.year || [],
            })
            setConfidenceLevel(detection.meta?.confidence_level || 'low')
          }
          
          // Detection result structure from Step 2
          const best = detection.best || {}
          if (best.make?.value) {
            setValue('make', best.make.value)
            setAiPrefilledValues(prev => ({ ...prev, make: best.make.value }))
          }
          if (best.model?.value) {
            setValue('model', best.model.value)
            setAiPrefilledValues(prev => ({ ...prev, model: best.model.value }))
          }
          if (best.color?.value) {
            setValue('color', best.color.value)
            setAiPrefilledValues(prev => ({ ...prev, color: best.color.value }))
          }
          if (best.year?.value) {
            setValue('year', best.year.value.toString())
            setAiPrefilledValues(prev => ({ ...prev, year: best.year.value.toString() }))
          }
        }
        
        setPrefillLoaded(true)
      } catch (error) {
        console.error('Failed to load prefill:', error)
        setPrefillLoaded(true)
      }
    }
    
    loadPrefill()
  }, [setValue, aiDetection, listingId])

  // Load models when make changes
  const makeValue = watch('make')
  useEffect(() => {
    if (makeValue && makes.includes(makeValue)) {
      const loadModels = async () => {
        try {
          const modelsList = await apiClient.getModels(makeValue)
          setModels(modelsList)
        } catch (error) {
          console.error('Failed to load models:', error)
        }
      }
      loadModels()
    } else {
      setModels([])
    }
  }, [makeValue, makes])

  // Track user overrides when they change AI-filled fields
  const handleFieldChange = async (field: 'make' | 'model' | 'color' | 'year', value: string) => {
    const aiValue = aiPrefilledValues[field]
    if (aiValue && value !== aiValue) {
      // User changed AI-filled value
      const newOverrides = { ...userOverrides, [field]: value }
      setUserOverrides(newOverrides)
      
      // Save to backend
      const listingId = sessionStorage.getItem('sell_listing_id')
      if (listingId) {
        try {
          await apiClient.updateListingUserOverrides(parseInt(listingId), newOverrides)
        } catch (error) {
          console.error('Failed to save user overrides:', error)
        }
      }
    }
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, features: selectedFeatures }
      sessionStorage.setItem('sell_car_details', JSON.stringify(payload))
      setCarDetails(payload)

      const loc = location || (() => { try { return JSON.parse(sessionStorage.getItem('sell_location') || '{}') } catch { return {} } })()
      if (listingId && (loc.country || loc.state || loc.city)) {
        await apiClient.updateDraftListing(listingId, {
          ...payload,
          location_country: loc.country || null,
          location_state: loc.state || null,
          location_city: loc.city || null,
        })
      }

      router.push(`/${locale}/sell/step5`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save details',
        variant: 'destructive',
      })
    }
  }

  const modelValue = watch('model')
  const yearValue = watch('year')
  const colorValue = watch('color')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-3xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2 flex-wrap">
              <span>Step 4: Car Details</span>
              {aiDetection && (aiDetection.make || aiDetection.model) && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Detected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {aiDetection && (aiDetection.make || aiDetection.model) ? (
                <span className="text-green-400/90 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>AI detected Make and Model. You can change any field.</span>
                </span>
              ) : (
                'Fill in your car\'s specifications'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Make, Model, Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Label className="text-gray-300">Make *</Label>
                    {aiDetection?.make && (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        AI Detected
                      </span>
                    )}
                  </div>
                  {makes.length > 0 ? (
                    <Select
                      value={makeValue || ''}
                      onValueChange={(value) => {
                        setValue('make', value)
                        setValue('model', '') // Reset model when make changes
                        handleFieldChange('make', value)
                      }}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                        <SelectValue placeholder="Select Make" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiSuggestions.make && aiSuggestions.make.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-blue-400">AI Suggestions</div>
                            {aiSuggestions.make.map((suggestion, idx) => (
                              <SelectItem key={`ai-${idx}`} value={suggestion.value as string}>
                                {suggestion.value} ({Math.round(suggestion.confidence * 100)}%)
                              </SelectItem>
                            ))}
                            <div className="border-t border-gray-600 my-1" />
                          </>
                        )}
                        {makes.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      {...register('make', { required: 'Make is required' })}
                      className="bg-gray-700 border-gray-600 text-white mt-1"
                      placeholder="Toyota"
                      onChange={(e) => handleFieldChange('make', e.target.value)}
                    />
                  )}
                  {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message as string}</p>}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Label className="text-gray-300">Model *</Label>
                    {aiDetection?.model && (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        AI Detected
                      </span>
                    )}
                  </div>
                  {models.length > 0 ? (
                    <Select
                      value={modelValue || ''}
                      onValueChange={(value) => {
                        setValue('model', value)
                        handleFieldChange('model', value)
                      }}
                      disabled={!makeValue}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiSuggestions.model && aiSuggestions.model.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-blue-400">AI Suggestions</div>
                            {aiSuggestions.model.map((suggestion, idx) => (
                              <SelectItem key={`ai-${idx}`} value={suggestion.value as string}>
                                {suggestion.value} ({Math.round(suggestion.confidence * 100)}%)
                              </SelectItem>
                            ))}
                            <div className="border-t border-gray-600 my-1" />
                          </>
                        )}
                        {models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      {...register('model', { required: 'Model is required' })}
                      className="bg-gray-700 border-gray-600 text-white mt-1"
                      placeholder="Camry"
                      disabled={!makeValue}
                      onChange={(e) => handleFieldChange('model', e.target.value)}
                    />
                  )}
                  {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message as string}</p>}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Label className="text-gray-300">Year *</Label>
                    {aiSuggestions.year && aiSuggestions.year.length > 0 && (
                      <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400 bg-blue-500/10">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggestions
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={yearValue || ''}
                    onValueChange={(value) => {
                      setValue('year', value)
                      handleFieldChange('year', value)
                    }}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiSuggestions.year && aiSuggestions.year.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-blue-400">AI Suggestions</div>
                          {aiSuggestions.year.map((suggestion, idx) => (
                            <SelectItem key={`ai-${idx}`} value={suggestion.value.toString()}>
                              {suggestion.value} ({Math.round(suggestion.confidence * 100)}%)
                            </SelectItem>
                          ))}
                          <div className="border-t border-gray-600 my-1" />
                        </>
                      )}
                      {Array.from({ length: 37 }, (_, i) => 2026 - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message as string}</p>}
                </div>
              </div>

              {/* Trim, Mileage, Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Trim/Version</Label>
                  <Input
                    {...register('trim')}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="EX-L, Sport, Limited"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Mileage *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      {...register('mileage', { required: 'Mileage is required', min: 0, max: 999999 })}
                      type="number"
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="45000"
                    />
                    <select
                      {...register('mileage_unit')}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      defaultValue="km"
                    >
                      <option value="km">km</option>
                      <option value="miles">miles</option>
                    </select>
                  </div>
                  {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage.message as string}</p>}
                </div>
                <div>
                  <Label className="text-gray-300">Price *</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                    <Input
                      {...register('price', { required: 'Price is required', min: 0 })}
                      type="number"
                      className="pl-7 bg-gray-700 border-gray-600 text-white"
                      placeholder="18500"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message as string}</p>}
                </div>
              </div>

              {/* Fuel consumption (L/100km) - optional */}
              <div>
                <Label className="text-gray-300">Fuel consumption (L/100km) (Optional)</Label>
                <Input
                  {...register('fuel_consumption_l100km')}
                  type="number"
                  step="0.1"
                  min="0"
                  className="bg-gray-700 border-gray-600 text-white mt-1 max-w-[200px]"
                  placeholder="e.g. 7.5"
                />
                <p className="text-gray-400 text-xs mt-1">Liters per 100 km. Lower is more efficient.</p>
              </div>

              {/* Condition, Transmission, Fuel Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Condition *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CONDITIONS.map(cond => (
                      <label key={cond} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value={cond}
                          {...register('condition', { required: 'Condition is required' })}
                          className="text-blue-600"
                        />
                        <span className="text-gray-300 text-sm">{cond}</span>
                      </label>
                    ))}
                  </div>
                  {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message as string}</p>}
                </div>
                <div>
                  <Label className="text-gray-300">Transmission *</Label>
                  <select
                    {...register('transmission', { required: 'Transmission is required' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mt-1"
                  >
                    <option value="">Select</option>
                    {TRANSMISSIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.transmission && <p className="text-red-500 text-sm mt-1">{errors.transmission.message as string}</p>}
                </div>
                <div>
                  <Label className="text-gray-300">Fuel Type *</Label>
                  <select
                    {...register('fuel_type', { required: 'Fuel type is required' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mt-1"
                  >
                    <option value="">Select</option>
                    {FUEL_TYPES.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {errors.fuel_type && <p className="text-red-500 text-sm mt-1">{errors.fuel_type.message as string}</p>}
                </div>
              </div>

              {/* Color (Optional) */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Label className="text-gray-300">Color (Optional)</Label>
                  {aiSuggestions.color && aiSuggestions.color.length > 0 && (
                    <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400 bg-blue-500/10">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Suggestions
                    </Badge>
                  )}
                </div>
                {aiSuggestions.color && aiSuggestions.color.length > 0 ? (
                  <Select
                    value={colorValue || ''}
                    onValueChange={(value) => {
                      setValue('color', value)
                      handleFieldChange('color', value)
                    }}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Select Color (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-blue-400">AI Suggestions</div>
                      {aiSuggestions.color.map((suggestion, idx) => (
                        <SelectItem key={`ai-${idx}`} value={suggestion.value as string}>
                          {suggestion.value} ({Math.round(suggestion.confidence * 100)}%)
                        </SelectItem>
                      ))}
                      <div className="border-t border-gray-600 my-1" />
                      {COLOR_LABELS.filter(c => !aiSuggestions.color?.some(s => s.value === c)).map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...register('color')}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="Silver (optional)"
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                  />
                )}
              </div>

              {/* Features */}
              <div>
                <Label className="text-gray-300">Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {FEATURES.map(feature => (
                    <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={selectedFeatures.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  {...register('description', { maxLength: 2000 })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Describe condition, service history, upgrades..."
                  rows={5}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-gray-400 text-sm">Optional</p>
                  <p className="text-gray-400 text-sm">{(description ?? '').length}/2000</p>
                </div>
              </div>

              {/* VIN */}
              <div>
                <Label className="text-gray-300">VIN</Label>
                <Input
                  {...register('vin', { pattern: { value: /^[A-HJ-NPR-Z0-9]{17}$/, message: 'Invalid VIN format' } })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                />
                <p className="text-gray-400 text-xs mt-1">Adding VIN increases buyer trust</p>
                {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin.message as string}</p>}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/sell/step2`)}
                  className="border-gray-600 text-gray-300"
                >
                  Back
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
