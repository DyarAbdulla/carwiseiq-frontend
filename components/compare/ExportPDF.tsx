'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { exportToPDF, type ExportCompareData } from '@/lib/exportComparePDF'

interface ExportPDFProps {
  data: ExportCompareData | null
  onSuccess?: () => void
  onError?: (err: Error) => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function ExportPDF({
  data,
  onSuccess,
  onError,
  disabled = false,
  variant = 'outline',
  className = '',
  children,
}: ExportPDFProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!data) return
    setLoading(true)
    try {
      await exportToPDF(data)
      onSuccess?.()
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Export failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !data || loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin me-2" />
      ) : (
        <Download className="h-4 w-4 me-2" />
      )}
      {children ?? 'Export PDF'}
    </Button>
  )
}
