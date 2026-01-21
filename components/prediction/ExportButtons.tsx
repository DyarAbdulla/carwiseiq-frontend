"use client"

import { Button } from '@/components/ui/button'
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import type { PredictionResponse, CarFeatures } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface ExportButtonsProps {
  result: PredictionResponse
  carFeatures: CarFeatures
}

export function ExportButtons({ result, carFeatures }: ExportButtonsProps) {
  const { toast } = useToast()

  const handleExportExcel = async () => {
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
      
      toast({
        title: 'Success',
        description: 'Excel file downloaded successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export Excel file',
        variant: 'destructive',
      })
    }
  }

  const handleExportPDF = async () => {
    try {
      // For now, create a simple text-based PDF using jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      doc.setFontSize(18)
      doc.text('Car Price Prediction Report', 20, 20)
      
      doc.setFontSize(12)
      let y = 40
      
      doc.text(`Make: ${carFeatures.make}`, 20, y)
      y += 10
      doc.text(`Model: ${carFeatures.model}`, 20, y)
      y += 10
      doc.text(`Year: ${carFeatures.year}`, 20, y)
      y += 10
      doc.text(`Mileage: ${carFeatures.mileage.toLocaleString()} km`, 20, y)
      y += 10
      doc.text(`Condition: ${carFeatures.condition}`, 20, y)
      y += 10
      doc.text(`Fuel Type: ${carFeatures.fuel_type}`, 20, y)
      y += 10
      doc.text(`Location: ${carFeatures.location}`, 20, y)
      y += 20
      
      doc.setFontSize(16)
      doc.text('Prediction Results', 20, y)
      y += 15
      
      doc.setFontSize(12)
      doc.text(`Predicted Price: ${formatCurrency(result.predicted_price)}`, 20, y)
      y += 10
      
      if (result.confidence_interval) {
        doc.text(
          `Confidence Interval: ${formatCurrency(result.confidence_interval.lower)} - ${formatCurrency(result.confidence_interval.upper)}`,
          20,
          y
        )
        y += 10
      }
      
      if (result.market_comparison) {
        doc.text(`Market Average: ${formatCurrency(result.market_comparison.market_average)}`, 20, y)
        y += 10
        doc.text(
          `Difference: ${result.market_comparison.percentage_difference > 0 ? '+' : ''}${result.market_comparison.percentage_difference.toFixed(1)}%`,
          20,
          y
        )
      }
      
      doc.save(`car-prediction-${carFeatures.make}-${carFeatures.model}-${Date.now()}.pdf`)
      
      toast({
        title: 'Success',
        description: 'PDF file downloaded successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF file',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
      >
        <FileText className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  )
}






