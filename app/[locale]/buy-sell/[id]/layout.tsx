import type { ReactNode } from 'react'
import { Metadata } from 'next'
import { generateListingMetadata } from '@/app/metadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${baseUrl}/api/marketplace/listings/${id}`, {
      next: { revalidate: 3600 }
    })

    if (response.ok) {
      const listing = await response.json()
      return generateListingMetadata({
        make: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        description: listing.description,
        images: listing.images,
      })
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  return {
    title: 'Car Listing - Car Price Predictor',
    description: 'View car listing details on Car Price Predictor marketplace',
  }
}

export default function ListingDetailLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
