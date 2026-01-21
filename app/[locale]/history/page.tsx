"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Calendar, TrendingUp, MessageSquare, CheckCircle2, XCircle, AlertCircle, Target } from 'lucide-react'
import { apiClient } from '@/lib/api'
import type { PredictionHistoryItem } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { FeedbackPrompt } from '@/components/prediction/FeedbackPrompt'
import { motion } from 'framer-motion'

export default function PredictionHistoryPage() {
  const t = useTranslations('feedback.history')
  const tCommon = useTranslations('common')
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }

  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionHistoryItem | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPredictionHistory(100, 0)
      setPredictions(response.predictions)
    } catch (error: any) {
      console.error('Error loading prediction history:', error)
      if (toast?.toast) {
        toast.toast({
          title: tCommon?.('error') || 'Error',
          description: error.message || 'Failed to load prediction history',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast, tCommon])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    })
  }

  // Calculate accuracy indicator for a prediction
  const getAccuracyIndicator = (prediction: PredictionHistoryItem) => {
    if (!prediction.feedback) {
      return {
        status: 'no_feedback',
        label: 'No feedback yet',
        icon: AlertCircle,
        color: 'text-[#94a3b8]',
        bgColor: 'bg-[#2a2d3a]'
      }
    }

    const rating = prediction.feedback.rating || 0
    const isAccurate = prediction.feedback.is_accurate

    if (isAccurate === true || rating >= 4) {
      return {
        status: 'accurate',
        label: 'Accurate',
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        accuracy: rating >= 4 ? `${rating * 20}%` : 'Accurate'
      }
    } else if (isAccurate === false || rating <= 2) {
      return {
        status: 'inaccurate',
        label: 'Needs improvement',
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        accuracy: rating > 0 ? `${rating * 20}%` : 'Inaccurate'
      }
    } else {
      return {
        status: 'partial',
        label: 'Partially accurate',
        icon: Target,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        accuracy: `${rating * 20}%`
      }
    }
  }

  // Calculate overall accuracy statistics
  const calculateOverallAccuracy = () => {
    const withFeedback = predictions.filter(p => p.feedback)
    if (withFeedback.length === 0) return null

    const accurate = withFeedback.filter(p =>
      p.feedback?.is_accurate === true || (p.feedback?.rating || 0) >= 4
    ).length

    const avgRating = withFeedback.reduce((sum, p) =>
      sum + (p.feedback?.rating || 0), 0
    ) / withFeedback.length

    return {
      total: withFeedback.length,
      accurate,
      accuracyPercent: Math.round((accurate / withFeedback.length) * 100),
      avgRating: Math.round(avgRating * 10) / 10
    }
  }

  const overallStats = calculateOverallAccuracy()

  const handleUpdateFeedback = (prediction: PredictionHistoryItem) => {
    setSelectedPrediction(prediction)
  }

  const handleFeedbackSubmitted = () => {
    loadHistory() // Reload to get updated feedback
    setSelectedPrediction(null)
    if (toast?.toast) {
      toast.toast({
        title: tCommon?.('success') || 'Success',
        description: 'Feedback updated successfully',
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-[#94a3b8]">{t('description')}</p>
        </div>

        {/* Overall Accuracy Statistics */}
        {overallStats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="border-[#2a2d3a] bg-[#1a1d29]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#94a3b8] mb-1">Total Predictions</p>
                    <p className="text-2xl font-bold text-white">{overallStats.total}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-[#5B7FFF]" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#2a2d3a] bg-[#1a1d29]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#94a3b8] mb-1">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-green-500">{overallStats.accuracyPercent}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#2a2d3a] bg-[#1a1d29]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#94a3b8] mb-1">Average Rating</p>
                    <p className="text-2xl font-bold text-yellow-400">{overallStats.avgRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Prediction List */}
        {predictions.length === 0 ? (
          <Card className="border-[#2a2d3a] bg-[#1a1d29]">
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-[#94a3b8] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t('noHistory')}</h3>
              <p className="text-[#94a3b8]">{t('noHistoryDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction) => {
              const car = prediction.car_features
              const accuracyIndicator = getAccuracyIndicator(prediction)
              const IndicatorIcon = accuracyIndicator.icon

              return (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-[#2a2d3a] bg-[#1a1d29] hover:border-[#3a3d4a] transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">
                              {car.make} {car.model} ({car.year})
                            </CardTitle>
                            {/* Accuracy Badge */}
                            <Badge
                              variant="outline"
                              className={`${accuracyIndicator.bgColor} ${accuracyIndicator.color} border-current`}
                            >
                              <IndicatorIcon className="h-3 w-3 mr-1" />
                              {accuracyIndicator.label}
                            </Badge>
                          </div>
                          <CardDescription className="text-[#94a3b8]">
                            {formatDate(prediction.timestamp)}
                            {prediction.feedback?.updated_at && prediction.feedback.updated_at !== prediction.timestamp && (
                              <span className="ml-2 text-xs">
                                • Updated {formatDate(prediction.feedback.updated_at)}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="outline" className="text-lg font-semibold mb-2 block">
                            {formatPrice(prediction.predicted_price)}
                          </Badge>
                          {prediction.confidence_level && (
                            <Badge
                              variant={
                                prediction.confidence_level === 'high' ? 'default' :
                                prediction.confidence_level === 'medium' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {prediction.confidence_level} confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {/* Car Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-[#94a3b8]">Mileage:</span>
                        <span className="ml-2 text-white">{car.mileage.toLocaleString()} km</span>
                      </div>
                      <div>
                        <span className="text-[#94a3b8]">Condition:</span>
                        <span className="ml-2 text-white">{car.condition}</span>
                      </div>
                      <div>
                        <span className="text-[#94a3b8]">Location:</span>
                        <span className="ml-2 text-white">{car.location}</span>
                      </div>
                      <div>
                        <span className="text-[#94a3b8]">Fuel:</span>
                        <span className="ml-2 text-white">{car.fuel_type}</span>
                      </div>
                    </div>

                    {/* Accuracy Details */}
                    {prediction.feedback && (
                      <div className={`p-4 ${accuracyIndicator.bgColor} rounded-lg border ${accuracyIndicator.color}/20 space-y-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={`h-4 w-4 ${accuracyIndicator.color}`} />
                            <span className={`text-sm font-medium ${accuracyIndicator.color}`}>
                              {t('feedback')}
                            </span>
                          </div>
                          {accuracyIndicator.accuracy && (
                            <Badge variant="outline" className={accuracyIndicator.color}>
                              {accuracyIndicator.accuracy} accuracy
                            </Badge>
                          )}
                        </div>

                        {/* Rating Stars */}
                        {prediction.feedback.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#94a3b8]">{t('rating')}:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 transition-colors ${
                                    star <= (prediction.feedback?.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-[#2a2d3a]'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-[#94a3b8] ml-1">
                              ({prediction.feedback.rating}/5)
                            </span>
                          </div>
                        )}

                        {/* Accuracy Status */}
                        {prediction.feedback.is_accurate !== null && (
                          <div className="flex items-center gap-2">
                            <IndicatorIcon className={`h-4 w-4 ${accuracyIndicator.color}`} />
                            <span className={`text-sm font-medium ${accuracyIndicator.color}`}>
                              {prediction.feedback.is_accurate ? 'Marked as accurate' : 'Marked as inaccurate'}
                            </span>
                          </div>
                        )}

                        {/* Feedback Reasons */}
                        {prediction.feedback.feedback_reasons && prediction.feedback.feedback_reasons.length > 0 && (
                          <div className="pt-2 border-t border-[#2a2d3a]">
                            <p className="text-xs text-[#94a3b8] mb-1">Issues reported:</p>
                            <div className="flex flex-wrap gap-1">
                              {prediction.feedback.feedback_reasons.map((reason, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {reason.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Corrected Information */}
                        {(prediction.feedback.correct_make || prediction.feedback.correct_model || prediction.feedback.correct_price) && (
                          <div className="pt-2 border-t border-[#2a2d3a]">
                            <p className="text-xs text-[#94a3b8] mb-1">Corrections provided:</p>
                            <div className="text-xs text-white space-y-1">
                              {prediction.feedback.correct_make && (
                                <div>Make: {prediction.feedback.correct_make}</div>
                              )}
                              {prediction.feedback.correct_model && (
                                <div>Model: {prediction.feedback.correct_model}</div>
                              )}
                              {prediction.feedback.correct_price && (
                                <div>Price: {formatPrice(prediction.feedback.correct_price)}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Update Feedback Button */}
                    <Button
                      onClick={() => handleUpdateFeedback(prediction)}
                      variant={prediction.feedback ? "outline" : "default"}
                      className={`w-full ${
                        prediction.feedback
                          ? "border-[#2a2d3a] hover:bg-[#2a2d3a]"
                          : "bg-[#5B7FFF] hover:bg-[#4a6fef]"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {prediction.feedback ? t('updateFeedback') : 'Add Feedback'}
                    </Button>
                  </CardContent>
                </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Feedback Modal for Selected Prediction */}
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPrediction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-2xl w-full border-[#2a2d3a] bg-[#1a1d29] max-h-[90vh] overflow-y-auto">
                <CardHeader className="relative">
                  <CardTitle>
                    {selectedPrediction.feedback ? t('updateFeedback') : 'Add Feedback'}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {selectedPrediction.car_features.make} {selectedPrediction.car_features.model} ({selectedPrediction.car_features.year})
                  </CardDescription>
                  <Button
                    onClick={() => setSelectedPrediction(null)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent>
                  <FeedbackPrompt
                    predictionId={selectedPrediction.id}
                    result={{
                      predicted_price: selectedPrediction.predicted_price,
                      confidence_interval: selectedPrediction.confidence_interval,
                      confidence_level: selectedPrediction.confidence_level as 'high' | 'medium' | 'low' | undefined,
                    }}
                    carFeatures={selectedPrediction.car_features}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
