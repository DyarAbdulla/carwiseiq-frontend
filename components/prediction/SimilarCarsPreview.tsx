"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SimilarCarsTable } from './SimilarCarsTable'
import { SimilarCarsDialog } from './SimilarCarsDialog'
import type { SimilarCar } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

interface SimilarCarsPreviewProps {
  cars: SimilarCar[]
}

const PREVIEW_ROWS = 3

export function SimilarCarsPreview({ cars }: SimilarCarsPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const list = cars.filter(c => c.price > 0)
  const total = list.length

  if (total === 0) {
    return (
      <p className="text-sm text-[#94a3b8] py-4">No similar cars found in the dataset.</p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-2 px-2">
        <SimilarCarsTable cars={cars} limit={PREVIEW_ROWS} compact />
      </div>
      {total > PREVIEW_ROWS && (
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a]"
          onClick={() => setDialogOpen(true)}
        >
          View all ({total})
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
      <SimilarCarsDialog open={dialogOpen} onOpenChange={setDialogOpen} cars={cars} />
    </div>
  )
}
