"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SimilarCarsTable } from './SimilarCarsTable'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import type { SimilarCar } from '@/lib/types'

interface SimilarCarsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cars: SimilarCar[]
}

export function SimilarCarsDialog({ open, onOpenChange, cars }: SimilarCarsDialogProps) {
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null)
  const list = cars.filter(c => c.price > 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[90vh] h-[90vh] sm:h-auto sm:max-h-[85vh] w-[95vw] max-w-2xl p-0 gap-0 flex flex-col"
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b border-[#2a2d3a]">
            <DialogTitle>Similar Cars ({list.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 -mx-4 px-4">
            <SimilarCarsTable
              cars={cars}
              onImageClick={(url, alt) => setLightbox({ url, alt })}
            />
          </div>
        </DialogContent>
      </Dialog>
      <ImageLightbox
        imageUrl={lightbox?.url || null}
        alt={lightbox?.alt || ''}
        isOpen={lightbox !== null}
        onClose={() => setLightbox(null)}
      />
    </>
  )
}
