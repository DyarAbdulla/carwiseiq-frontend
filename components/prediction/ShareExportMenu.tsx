"use client"

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, ChevronDown, Copy, FileText, FileSpreadsheet, Check } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import type { PredictionResponse, CarFeatures } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { SavePrediction } from './SavePrediction'

interface ShareExportMenuProps {
  result: PredictionResponse
  carFeatures: CarFeatures
}

function useShareExport(result: PredictionResponse, carFeatures: CarFeatures) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const generateShareText = () => {
    const carInfo = `${carFeatures.year} ${carFeatures.make} ${carFeatures.model}`
    const price = formatCurrency(result.predicted_price)
    return `Car Price Prediction: ${carInfo}\nEstimated Value: ${price}\n\nPredicted using Car Price Predictor Pro`
  }

  const generateShareUrl = () => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams({
      make: carFeatures.make,
      model: carFeatures.model,
      year: carFeatures.year.toString(),
      mileage: carFeatures.mileage.toString(),
      condition: carFeatures.condition,
      price: result.predicted_price.toString(),
    })
    return `${window.location.origin}/predict?${params.toString()}`
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText())
      setCopied(true)
      toast({ title: 'Copied!', description: 'Prediction details copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Error', description: 'Failed to copy to clipboard', variant: 'destructive' })
    }
  }

  const onShare = async () => {
    const shareData = {
      title: 'Car Price Prediction',
      text: generateShareText(),
      url: generateShareUrl(),
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') onCopy()
      }
    } else {
      onCopy()
    }
  }

  const onExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Car Price Prediction Report', 20, 20)
      doc.setFontSize(12)
      let y = 40
      const lines = [
        `Make: ${carFeatures.make}`,
        `Model: ${carFeatures.model}`,
        `Year: ${carFeatures.year}`,
        `Mileage: ${carFeatures.mileage.toLocaleString()} km`,
        `Condition: ${carFeatures.condition}`,
        `Fuel Type: ${carFeatures.fuel_type}`,
        `Location: ${carFeatures.location}`,
        '',
        'Prediction Results',
        `Predicted Price: ${formatCurrency(result.predicted_price)}`,
      ]
      result.confidence_interval && lines.push(
        `Confidence: ${formatCurrency(result.confidence_interval.lower)} - ${formatCurrency(result.confidence_interval.upper)}`
      )
      result.market_comparison && lines.push(
        `Market Average: ${formatCurrency(result.market_comparison.market_average)}`,
        `Difference: ${result.market_comparison.percentage_difference > 0 ? '+' : ''}${result.market_comparison.percentage_difference.toFixed(1)}%`
      )
      for (const t of lines) {
        if (t) doc.text(t, 20, y)
        y += 10
      }
      doc.save(`car-prediction-${carFeatures.make}-${carFeatures.model}-${Date.now()}.pdf`)
      toast({ title: 'Success', description: 'PDF downloaded' })
    } catch {
      toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' })
    }
  }

  const onExportExcel = async () => {
    try {
      const data = [{
        'Make': carFeatures.make,
        'Model': carFeatures.model,
        'Year': carFeatures.year,
        'Mileage (km)': carFeatures.mileage,
        'Condition': carFeatures.condition,
        'Fuel Type': carFeatures.fuel_type,
        'Location': carFeatures.location,
        'Predicted Price': result.predicted_price,
        'Lower CI': result.confidence_interval?.lower || '',
        'Upper CI': result.confidence_interval?.upper || '',
        'Market Average': result.market_comparison?.market_average || '',
        'Deal Score': result.deal_score?.label || '',
      }]
      const blob = await apiClient.exportExcel(data)
      apiClient.downloadBlob(blob, `car-prediction-${carFeatures.make}-${carFeatures.model}-${Date.now()}.xlsx`)
      toast({ title: 'Success', description: 'Excel downloaded' })
    } catch {
      toast({ title: 'Error', description: 'Failed to export Excel', variant: 'destructive' })
    }
  }

  return { onCopy, onShare, onExportPDF, onExportExcel, copied }
}

export function ShareExportMenu({ result, carFeatures }: ShareExportMenuProps) {
  const { onCopy, onShare, onExportPDF, onExportExcel, copied } = useShareExport(result, carFeatures)

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="w-full sm:flex-1 sm:min-w-0">
        <SavePrediction result={result} carFeatures={carFeatures} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share / Export
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy Results
          </DropdownMenuItem>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
