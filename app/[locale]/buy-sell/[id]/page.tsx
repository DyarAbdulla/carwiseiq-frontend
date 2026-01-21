"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { 
  Phone, Share2, MapPin, Calendar, ChevronLeft, ChevronRight, Flag, CheckCircle2, PlayCircle,
  Edit, Trash2, CheckCircle, XCircle
} from 'lucide-react'
import { FavoriteButton } from '@/components/marketplace/FavoriteButton'
import { SimilarCarsRecommendations } from '@/components/marketplace/SimilarCarsRecommendations'
import { SocialShareButtons } from '@/components/marketplace/SocialShareButtons'
import { ListingDetailSkeleton } from '@/components/common/LoadingSkeleton'
import { ListingStructuredData } from '@/components/common/StructuredData'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import { listingImageUrl, isVideoFile, formatPhoneNumber, getContactTel } from '@/lib/utils'
import { SoldBadge } from '@/components/ui/sold-badge'
import { ReportModal } from '@/components/listings/ReportModal'

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
  const [showReportModal, setShowReportModal] = useState(false)

  const loadListing = useCallback(async () => {
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
  }, [listingId, toast, tCommon, t])

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
  }, [listingId, loadListing, toast, tCommon, t])

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
  const isRTL = locale === 'ar' || locale === 'ku'
  const isSold = listing?.status === 'sold' || listing?.status === 'Sold'

  return (
    <>
      <ListingStructuredData listing={listing} />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto pt-20">
          {/* SOLD banner */}
          {isSold && (
            <div className="mb-6 rounded-lg bg-red-600/90 px-4 py-3 text-center">
              <p className="text-lg font-bold uppercase tracking-wider text-white">{t('vehicleSold')}</p>
            </div>
          )}
          {/* dir=ltr keeps main left / sidebar right in all locales; text dir restored per column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="ltr">
            {/* Main content - Images & Details */}
            <div className="lg:col-span-2 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Image Gallery */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-700 rounded-t-lg overflow-hidden">
                  {(() => {
                    const mediaUrl = currentImage?.url || listing.cover_image
                    const isVideo = mediaUrl && isVideoFile(mediaUrl)
                    if (!mediaUrl) {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {t('noImageAvailable')}
                        </div>
                      )
                    }
                    if (isVideo) {
                      return (
                        <video
                          src={listingImageUrl(mediaUrl)}
                          controls
                          preload="metadata"
                          className="w-full h-full object-cover"
                          playsInline
                        >
                          Your browser does not support video playback.
                        </video>
                      )
                    }
                    return (
                      <Image
                        src={listingImageUrl(mediaUrl)}
                        alt={`${listing?.year ?? ''} ${listing?.make ?? ''} ${listing?.model ?? ''}`.trim() || 'Car'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/cars/default-car.jpg'
                        }}
                      />
                    )
                  })()}
                  {isSold && <SoldBadge variant="overlay" />}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute start-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                        aria-label={t('previousImage')}
                      >
                        <ChevronLeft className="h-5 w-5 rtl:scale-x-[-1]" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute end-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                        aria-label={t('nextImage')}
                      >
                        <ChevronRight className="h-5 w-5 rtl:scale-x-[-1]" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded text-white text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((img: any, idx: number) => {
                      const isVideo = isVideoFile(img?.url)
                      return (
                        <button
                          key={img?.id ?? idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 ${
                            idx === selectedImageIndex ? 'border-blue-500' : 'border-gray-700'
                          }`}
                          aria-label={t('viewImage', { current: idx + 1, total: images.length })}
                        >
                          {isVideo ? (
                            <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                              <PlayCircle className="w-8 h-8 text-white/90" />
                            </div>
                          ) : (
                            <Image
                              src={listingImageUrl(img?.url)}
                              alt={`${listing?.make ?? ''} ${listing?.model ?? ''} - Image ${idx + 1}`.trim() || `Image ${idx + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </button>
                      )
                    })}
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
                      {listing.year ?? '—'} {listing.make ?? '—'} {listing.model ?? '—'}{listing.trim ? ` ${listing.trim}` : ''}
                    </CardTitle>
                    <p className="text-blue-400 font-bold text-3xl mt-2">
                      ${(listing?.price ?? 0).toLocaleString()}
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
                        make: listing.make ?? '',
                        model: listing.model ?? '',
                        year: listing.year ?? 0,
                        price: listing?.price ?? 0,
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
                    <p className="text-gray-400 text-sm">{t('mileage')}</p>
                    <p className="text-white font-semibold">{(listing?.mileage ?? 0).toLocaleString()} {listing?.mileage_unit || ''}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('year')}</p>
                    <p className="text-white font-semibold">{listing?.year ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('transmission')}</p>
                    <p className="text-white font-semibold">{listing?.transmission || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('fuelType')}</p>
                    <p className="text-white font-semibold">{listing?.fuel_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('color')}</p>
                    <p className="text-white font-semibold">{listing?.color || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('condition')}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      (listing?.condition || '') === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                      (listing?.condition || '') === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                      (listing?.condition || '') === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {listing?.condition || '—'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {listing.features && listing.features.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">{t('features')}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {listing.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-300">
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
                    <h3 className="text-white font-semibold mb-3">{t('description')}</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{listing.description}</p>
                  </div>
                )}

                {/* VIN */}
                {listing.vin && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">{t('vin')}</h3>
                    <p className="text-gray-300 font-mono">{listing.vin}</p>
                  </div>
                )}

                {/* Price History */}
                {priceHistory.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">{t('priceHistory')}</h3>
                    <div className="space-y-2">
                      {priceHistory.slice(-5).reverse().map((entry: any, idx: number) => {
                        const prevPrice = (idx > 0 ? priceHistory[priceHistory.length - idx]?.price : listing?.price) ?? 0
                        const entryPrice = entry?.price ?? 0
                        const change = prevPrice ? entryPrice - prevPrice : 0
                        const changePercent = prevPrice ? ((change / prevPrice) * 100).toFixed(1) : '0'
                        const dateStr = entry?.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '—'
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                            <div>
                              <p className="text-white font-semibold">${(entryPrice).toLocaleString()}</p>
                              <p className="text-gray-400 text-xs">{dateStr}</p>
                            </div>
                            {change !== 0 && (
                              <div className={`text-sm font-semibold ${
                                change < 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {change > 0 ? '+' : ''}${Number.isFinite(change) ? change.toLocaleString() : '0'} ({changePercent}%)
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

            {/* Similar Cars Recommendations */}
            <SimilarCarsRecommendations
              listingId={parseInt(listingId, 10)}
              make={listing?.make ?? ''}
              model={listing?.model ?? ''}
              year={listing?.year ?? 0}
              price={listing?.price ?? 0}
            />
            </div>

            {/* Sidebar - Contact Seller */}
            <div className="lg:col-span-1 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <Card className="bg-gray-800 border-gray-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">{t('contactSeller')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-400">
                  <p className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {t('postedOn', { date: listing?.created_at ? new Date(listing.created_at).toLocaleDateString() : '—' })}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[listing?.location_city, listing?.location_state, listing?.location_country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>

                {(() => {
                  const canEdit = !!(user && listing?.user_id != null && Number(listing.user_id) === Number(user.id))
                  const handleEditListing = () => {
                    if (typeof sessionStorage !== 'undefined') {
                      sessionStorage.setItem('edit_listing_id', String(listingId))
                      sessionStorage.setItem('sell_listing_id', String(listingId))
                    }
                    router.push(`/${locale}/sell/step1?edit=${listingId}`)
                  }
                  if (canEdit) {
                    return (
                      <div className="space-y-2">
                        {!isSold && (
                          <Button
                            variant="outline"
                            className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 inline-flex justify-start gap-2"
                            onClick={handleEditListing}
                          >
                            <Edit className="h-4 w-4 shrink-0" />
                            Edit Listing
                          </Button>
                        )}
                        {(listing?.status === 'active' || listing?.status === 'Active') && (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 inline-flex justify-start gap-2"
                            onClick={async () => {
                              try {
                                await apiClient.markListingAsSold(parseInt(listingId, 10))
                                toast({ title: tCommon('success'), description: t('markedSold') || 'Marked as sold' })
                                loadListing()
                              } catch (e: any) {
                                toast({ title: tCommon('error'), description: e?.message || 'Failed', variant: 'destructive' })
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            Mark as sold
                          </Button>
                        )}
                        {(listing?.status === 'sold' || listing?.status === 'Sold') && (
                          <Button
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 inline-flex justify-start gap-2"
                            onClick={async () => {
                              try {
                                await apiClient.markListingAsAvailable(parseInt(listingId, 10))
                                toast({ title: tCommon('success'), description: 'Marked as available' })
                                loadListing()
                              } catch (e: any) {
                                toast({ title: tCommon('error'), description: e?.message || 'Failed', variant: 'destructive' })
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 shrink-0" />
                            Mark as available
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 inline-flex justify-start gap-2"
                          onClick={async () => {
                            if (!confirm(t('confirmDelete') || 'Delete this listing?')) return
                            try {
                              await apiClient.deleteListing(parseInt(listingId, 10))
                              toast({ title: tCommon('success'), description: 'Listing deleted' })
                              router.push(`/${locale}/buy-sell`)
                            } catch (e: any) {
                              toast({ title: tCommon('error'), description: e?.message || 'Failed', variant: 'destructive' })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                          Delete listing
                        </Button>
                      </div>
                    )
                  }
                  if (isSold) {
                    return (
                      <div className="rounded-lg bg-gray-700/50 px-4 py-4 text-center">
                        <p className="text-gray-300 font-medium">{t('vehicleSold')}</p>
                      </div>
                    )
                  }
                  if (listing?.phone) {
                    const tel = getContactTel(listing)
                    const displayPhone = formatPhoneNumber((listing?.phone_country_code || '') + (listing?.phone || ''))
                    return (
                      <div className="space-y-2">
                        {displayPhone && (
                          <p className="flex items-center gap-2 text-slate-300 text-sm">
                            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                            {displayPhone}
                          </p>
                        )}
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 inline-flex justify-start gap-2"
                          onClick={() => { if (tel) window.location.href = tel }}
                        >
                          <Phone className="h-4 w-4 shrink-0" />
                          {t('callNow')}
                        </Button>
                      </div>
                    )
                  }
                  return (
                    <div className="text-gray-400 text-sm text-center py-4">
                      {t('contactNotAvailable')}
                    </div>
                  )
                })()}

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-yellow-400 text-sm flex items-start gap-2">
                    <span className="shrink-0">⚠️</span>
                    {t('safetyTip')}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-600 text-gray-300 inline-flex justify-start gap-2"
                  onClick={() => setShowReportModal(true)}
                >
                  <Flag className="h-4 w-4 shrink-0" />
                  {t('reportListing')}
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
      {showReportModal && (
        <ReportModal listingId={listingId} onClose={() => setShowReportModal(false)} />
      )}
    </>
  )
}
