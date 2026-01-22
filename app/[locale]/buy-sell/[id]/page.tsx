"use client"


export const runtime = 'edge';
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { 
  Phone, MessageSquare, Share2, MapPin, Calendar, 
  ChevronLeft, ChevronRight, Flag, CheckCircle2 
} from 'lucide-react'
import { FavoriteButton } from '@/components/marketplace/FavoriteButton'
import { MarketInsights } from '@/components/marketplace/MarketInsights'
import { SimilarCarsRecommendations } from '@/components/marketplace/SimilarCarsRecommendations'
import { SocialShareButtons } from '@/components/marketplace/SocialShareButtons'
import { ListingDetailSkeleton } from '@/components/common/LoadingSkeleton'
import { ListingStructuredData } from '@/components/common/StructuredData'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import { listingImageUrl } from '@/lib/utils'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('listing')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const listingId = params?.id as string

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [priceHistory, setPriceHistory] = useState<any[]>([])

  useEffect(() => {
    if (listingId && !isNaN(parseInt(listingId))) {
      loadListing()
    } else {
      setLoading(false)
      toast({
        title: tCommon('error'),
        description: t('invalidId'),
        variant: 'destructive',
      })
    }
  }, [listingId])

  const loadListing = async () => {
    try {
      const listingIdNum = parseInt(listingId)
      if (isNaN(listingIdNum)) {
        throw new Error('Invalid listing ID')
      }
      const data = await apiClient.getListing(listingIdNum)
      if (!data) {
        throw new Error('Listing not found')
      }
      setListing(data)
      setIsSaved(data.is_saved || false)
      
      // Load price history
      try {
        const history = await apiClient.getPriceHistory(listingIdNum, 30)
        setPriceHistory(history.history || [])
      } catch (error) {
        // Ignore errors
      }
    } catch (error: any) {
      console.error('Error loading listing:', error)
      toast({
        title: tCommon('error'),
        description: error.message || t('loadError'),
        variant: 'destructive',
      })
      setListing(null)
    } finally {
      setLoading(false)
    }
  }


  const [marketInsights, setMarketInsights] = useState<any>(null)

  useEffect(() => {
    if (listing) {
      loadMarketInsights()
    }
  }, [listing])

  const loadMarketInsights = async () => {
    try {
      // Calculate market insights
      const similarData = await apiClient.searchListings({
        makes: listing.make,
        models: listing.model,
        min_year: listing.year - 2,
        max_year: listing.year + 2,
        page: 1,
        page_size: 20,
      })
      
      const similarListings = similarData.items || []
      const prices = similarListings.map((l: any) => l.price).filter((p: number) => p > 0)
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length
        const priceComparison = ((listing.price - avgPrice) / avgPrice) * 100
        
        // Determine market demand based on similar listings count
        let marketDemand: 'high' | 'medium' | 'low' = 'medium'
        if (similarListings.length > 15) marketDemand = 'high'
        else if (similarListings.length < 5) marketDemand = 'low'
        
        setMarketInsights({
          averagePrice: avgPrice,
          priceComparison,
          marketDemand,
          similarCarsCount: similarListings.length,
          soldRecently: Math.floor(similarListings.length * 0.3), // Estimate
        })
      }
    } catch (error) {
      console.error('Error loading market insights:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto pt-20">
          <ListingDetailSkeleton />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-white text-xl mb-4">{t('notFound')}</p>
            <Button onClick={() => router.push(`/${locale}/buy-sell`)} className="bg-blue-600 hover:bg-blue-700">
              {t('backToMarketplace')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const images = listing.images || []
  const currentImage = images[selectedImageIndex] || images[0] || null

  return (
    <>
      <ListingStructuredData listing={listing} />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-700 rounded-t-lg overflow-hidden">
                  {currentImage?.url || listing.cover_image ? (
                    <Image
                      src={listingImageUrl(currentImage?.url || listing.cover_image)}
                      alt={`${listing.year} ${listing.make} ${listing.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/cars/default-car.jpg'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      {t('noImageAvailable')}
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded text-white text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((img: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 ${
                          idx === selectedImageIndex ? 'border-blue-500' : 'border-gray-700'
                        }`}
                        aria-label={`View image ${idx + 1} of ${images.length}`}
                      >
                        <Image
                          src={listingImageUrl(img.url)}
                          alt={`${listing.make} ${listing.model} - Image ${idx + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Car Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-white">
                      {listing.year} {listing.make} {listing.model} {listing.trim ? listing.trim : ''}
                    </CardTitle>
                    <p className="text-blue-400 font-bold text-3xl mt-2">
                      ${listing.price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <FavoriteButton
                      listingId={parseInt(listingId)}
                      initialFavorite={isSaved}
                      size="sm"
                      onToggle={(isFavorite) => setIsSaved(isFavorite)}
                    />
                    <SocialShareButtons
                      listing={{
                        id: listing.id,
                        make: listing.make,
                        model: listing.model,
                        year: listing.year,
                        price: listing.price,
                      }}
                      url={typeof window !== 'undefined' ? window.location.href : ''}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Specs */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Mileage</p>
                    <p className="text-white font-semibold">{listing.mileage?.toLocaleString()} {listing.mileage_unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Year</p>
                    <p className="text-white font-semibold">{listing.year}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Transmission</p>
                    <p className="text-white font-semibold">{listing.transmission}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fuel Type</p>
                    <p className="text-white font-semibold">{listing.fuel_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Color</p>
                    <p className="text-white font-semibold">{listing.color}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Condition</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      listing.condition === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                      listing.condition === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                      listing.condition === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {listing.condition}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {listing.features && listing.features.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {listing.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {listing.description && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Description</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{listing.description}</p>
                  </div>
                )}

                {/* VIN */}
                {listing.vin && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">VIN</h3>
                    <p className="text-gray-300 font-mono">{listing.vin}</p>
                  </div>
                )}

                {/* Price History */}
                {priceHistory.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Price History</h3>
                    <div className="space-y-2">
                      {priceHistory.slice(-5).reverse().map((entry: any, idx: number) => {
                        const prevPrice = idx > 0 ? priceHistory[priceHistory.length - idx]?.price : listing.price
                        const change = prevPrice ? entry.price - prevPrice : 0
                        const changePercent = prevPrice ? ((change / prevPrice) * 100).toFixed(1) : 0
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                            <div>
                              <p className="text-white font-semibold">${entry.price.toLocaleString()}</p>
                              <p className="text-gray-400 text-xs">
                                {new Date(entry.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            {change !== 0 && (
                              <div className={`text-sm font-semibold ${
                                change < 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {change > 0 ? '+' : ''}${change.toLocaleString()} ({changePercent}%)
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Insights */}
            {marketInsights && (
              <MarketInsights
                listingPrice={listing.price}
                averagePrice={marketInsights.averagePrice}
                priceComparison={marketInsights.priceComparison}
                marketDemand={marketInsights.marketDemand}
                similarCarsCount={marketInsights.similarCarsCount}
                soldRecently={marketInsights.soldRecently}
              />
            )}

            {/* Similar Cars Recommendations */}
            <SimilarCarsRecommendations
              listingId={parseInt(listingId)}
              make={listing.make}
              model={listing.model}
              year={listing.year}
              price={listing.price}
            />
            </div>

            {/* Right Column - Seller Card */}
            <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Contact Seller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-400">
                  <p className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Posted {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {listing.location_city}, {listing.location_state}, {listing.location_country}
                  </p>
                </div>

                {listing.phone && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        window.location.href = `tel:${listing.phone_country_code || ''}${listing.phone}`
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(`/${locale}/login`)
                          return
                        }
                        // Redirect to messages page with listing and seller info
                        if (listing.user_id) {
                          router.push(`/${locale}/messages?listing=${listingId}&user=${listing.user_id}`)
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Seller information not available',
                            variant: 'destructive'
                          })
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      💬 Send Message
                    </Button>
                  </div>
                )}
                {!listing.phone && (
                  <div className="text-gray-400 text-sm text-center py-4">
                    Contact information not available
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-yellow-400 text-sm flex items-start">
                    <span className="mr-2">⚠️</span>
                    Always meet in public places and verify the vehicle before payment
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-600 text-gray-300"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report Listing
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
