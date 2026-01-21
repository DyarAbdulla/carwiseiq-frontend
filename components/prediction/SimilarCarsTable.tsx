"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import Image from 'next/image'
import type { SimilarCar } from '@/lib/types'

function getFullImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
  if (url.startsWith('/api/car-images/')) return `${apiBaseUrl}${url}`
  if (url.startsWith('/car_images/')) return `${apiBaseUrl}/api/car-images/${url.replace('/car_images/', '')}`
  return url.startsWith('/') ? `${apiBaseUrl}${url}` : `${apiBaseUrl}/api/car-images/${url}`
}

interface SimilarCarsTableProps {
  cars: SimilarCar[]
  /** Max rows to show; undefined = all */
  limit?: number
  onImageClick?: (url: string, alt: string) => void
  /** Smaller cells for preview */
  compact?: boolean
}

export function SimilarCarsTable({ cars, limit, onImageClick, compact }: SimilarCarsTableProps) {
  const filtered = cars.filter(c => c.price > 0)
  const list = limit != null ? filtered.slice(0, limit) : filtered
  const cellClass = compact ? 'py-2' : ''

  return (
    <Table className="min-w-full">
      <TableHeader>
        <TableRow className="border-[#2a2d3a]">
          <TableHead className={cn('text-[#94a3b8]', cellClass)}>Image</TableHead>
          <TableHead className={cn('text-[#94a3b8]', cellClass)}>Year</TableHead>
          <TableHead className={cn('text-[#94a3b8]', cellClass)}>Mileage (km)</TableHead>
          <TableHead className={cn('text-[#94a3b8]', cellClass)}>Condition</TableHead>
          <TableHead className={cn('text-[#94a3b8]', cellClass)}>Price ($)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-[#94a3b8] py-8">
              No similar cars found
            </TableCell>
          </TableRow>
        ) : (
          list.map((car, index) => {
            let imageSrc: string | null = car.image_url || (car.image_id ? `/api/car-images/${car.image_id}` : null)
            if (imageSrc && !imageSrc.startsWith('http')) imageSrc = getFullImageUrl(imageSrc)

            return (
              <TableRow key={index} className="border-[#2a2d3a]">
                <TableCell className={cn('whitespace-nowrap', cellClass)}>
                  {imageSrc ? (
                    <div
                      className={cn(
                        'rounded overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:opacity-90 transition',
                        compact ? 'w-[80px] h-[56px] sm:w-[100px] sm:h-[72px]' : 'w-[120px] h-[90px] sm:w-[160px] sm:h-[120px]'
                      )}
                      onClick={() => onImageClick?.(imageSrc!, `${car.year} ${car.make || ''} ${car.model || ''}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onImageClick?.(imageSrc!, `${car.year} ${car.make || ''} ${car.model || ''}`)}
                    >
                      <Image
                        src={imageSrc}
                        alt={`${car.year} ${car.make} ${car.model}`}
                        width={compact ? 100 : 160}
                        height={compact ? 72 : 120}
                        className="object-cover w-full h-full"
                        unoptimized
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  ) : (
                    <div className={cn('rounded bg-white/5 flex items-center justify-center text-[#94a3b8] text-xs border border-white/10', compact ? 'w-[80px] h-[56px]' : 'w-[120px] h-[90px]')}>
                      No Image
                    </div>
                  )}
                </TableCell>
                <TableCell className={cn('whitespace-nowrap text-white', cellClass)}>{car.year}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-white', cellClass)}>{formatNumber(car.mileage)}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-white', cellClass)}>{car.condition}</TableCell>
                <TableCell className={cn('font-semibold text-[#5B7FFF] whitespace-nowrap', cellClass)}>{formatCurrency(car.price)}</TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
