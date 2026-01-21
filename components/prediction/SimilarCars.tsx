"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import type { SimilarCar } from '@/lib/types'
import { ImageLightbox } from '@/components/ui/ImageLightbox'

interface SimilarCarsProps {
  cars: SimilarCar[]
}

export function SimilarCars({ cars }: SimilarCarsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null)

  return (
    <Card className="border-[#2a2d3a] bg-[#1a1d29]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between w-full text-white">
              <span className="flex items-center gap-2 text-sm sm:text-base">
                🚗 Similar Cars - Compare with Market Data
              </span>
              <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-[#2a2d3a]">
                    <TableHead className="text-[#94a3b8]">Image</TableHead>
                    <TableHead className="text-[#94a3b8]">Year</TableHead>
                    <TableHead className="text-[#94a3b8]">Mileage (km)</TableHead>
                    <TableHead className="text-[#94a3b8]">Condition</TableHead>
                    <TableHead className="text-[#94a3b8]">Price ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars.filter(car => car.price > 0).slice(0, 10).length > 0 ? (
                    cars.filter(car => car.price > 0).slice(0, 10).map((car, index) => (
                      <TableRow key={index} className="border-[#2a2d3a]">
                        <TableCell className="whitespace-nowrap">
                          {(() => {
                            // Get image source - use image_url if available, fallback to image_id
                            let imageSrc: string | null = null
                            
                            if (car.image_url) {
                              imageSrc = car.image_url
                            } else if (car.image_id) {
                              // Use image_id as fallback (e.g., car_000000.jpg)
                              imageSrc = `/api/car-images/${car.image_id}`
                            }
                            
                            // Helper function to convert to full URL
                            const getFullImageUrl = (url: string): string => {
                              if (url.startsWith('/api/car-images/') || url.startsWith('/car_images/')) {
                                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'
                                return url.startsWith('/api/car-images/') 
                                  ? `${apiBaseUrl}${url}`
                                  : `${apiBaseUrl}/api/car-images/${url.replace('/car_images/', '')}`
                              }
                              return url
                            }
                            
                            if (imageSrc) {
                              // Convert relative API paths to full URLs for full-resolution images
                              const fullImageUrl = getFullImageUrl(imageSrc)
                              
                              return (
                                <div 
                                  className="relative w-[120px] h-[90px] sm:w-[160px] sm:h-[120px] rounded overflow-hidden bg-white/5 border border-white/10 cursor-pointer group transition-transform duration-200 hover:scale-105"
                                  onClick={() => setLightboxImage({ url: fullImageUrl, alt: `${car.year} ${car.make} ${car.model}` })}
                                >
                                  <Image
                                    src={fullImageUrl}
                                    alt={`${car.year} ${car.make} ${car.model}`}
                                    width={160}
                                    height={120}
                                    className="object-cover w-full h-full"
                                    quality={100}
                                    priority={false}
                                    loading="lazy"
                                    unoptimized={true}
                                    onError={(e) => {
                                      // Fallback to placeholder if image fails
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                </div>
                              )
                            } else {
                              return (
                                <div className="w-[120px] h-[90px] sm:w-[160px] sm:h-[120px] rounded bg-white/5 flex items-center justify-center text-[#94a3b8] text-xs border border-white/10">
                                  No Image
                                </div>
                              )
                            }
                          })()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-white">{car.year}</TableCell>
                        <TableCell className="whitespace-nowrap text-white">{formatNumber(car.mileage)}</TableCell>
                        <TableCell className="whitespace-nowrap text-white">{car.condition}</TableCell>
                        <TableCell className="font-semibold text-[#5B7FFF] whitespace-nowrap">
                          {formatCurrency(car.price)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-[#94a3b8] py-8">
                        No similar cars found in the dataset
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Image Lightbox */}
      <ImageLightbox
        imageUrl={lightboxImage?.url || null}
        alt={lightboxImage?.alt || ''}
        isOpen={lightboxImage !== null}
        onClose={() => setLightboxImage(null)}
      />
    </Card>
  )
}

