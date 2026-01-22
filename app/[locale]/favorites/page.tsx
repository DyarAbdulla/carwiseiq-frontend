"use client"


export const runtime = 'edge';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, MapPin, Calendar, Filter, Grid, List } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { FavoriteButton } from '@/components/marketplace/FavoriteButton'
import { listingImageUrl } from '@/lib/utils'

export default function FavoritesPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('favorites')
  const tCommon = useTranslations('common')
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('recently_saved')
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    makes: [] as string[],
    location: ''
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
      return
    }
    loadFavorites()
  }, [page, sortBy, filters, isAuthenticated, authLoading])

  const loadFavorites = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const data = await apiClient.getFavorites({
        page,
        page_size: 15,
        sort_by: sortBy
      })
      
      let filtered = data.items || []
      
      // Apply filters
      if (filters.min_price) {
        filtered = filtered.filter((l: any) => l.price >= parseFloat(filters.min_price))
      }
      if (filters.max_price) {
        filtered = filtered.filter((l: any) => l.price <= parseFloat(filters.max_price))
      }
      if (filters.makes.length > 0) {
        filtered = filtered.filter((l: any) => filters.makes.includes(l.make))
      }
      if (filters.location) {
        filtered = filtered.filter((l: any) => 
          l.location_city?.toLowerCase().includes(filters.location.toLowerCase()) ||
          l.location_state?.toLowerCase().includes(filters.location.toLowerCase())
        )
      }
      
      setListings(filtered)
      setTotal(data.total || 0)
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || t('loadError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const saved = new Date(date)
    const diffMs = now.getTime() - saved.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return t('savedToday')
    if (diffDays === 1) return t('savedYesterday')
    if (diffDays < 7) return t('savedDaysAgo', { n: diffDays })
    if (diffDays < 30) return t('savedWeeksAgo', { n: Math.floor(diffDays / 7) })
    return t('savedMonthsAgo', { n: Math.floor(diffDays / 30) })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">{tCommon('loading')}</div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
          </div>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recently_saved">{t('recentlySaved')}</SelectItem>
              <SelectItem value="price_low">{t('priceLow')}</SelectItem>
              <SelectItem value="price_high">{t('priceHigh')}</SelectItem>
              <SelectItem value="newest_listings">{t('newestListings')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 border border-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gray-700' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-gray-700' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-white font-semibold">{t('filters')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">{t('priceRange')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t('min')}
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t('max')}
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">{t('location')}</label>
                <input
                  type="text"
                  placeholder={t('cityOrState')}
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({ min_price: '', max_price: '', makes: [], location: '' })}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  {t('clearFilters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">{t('loadingFavorites')}</div>
        ) : listings.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('noFavorites')}</h3>
              <p className="text-gray-400 mb-6">
                {t('noFavoritesDesc')}
              </p>
              <Button
                onClick={() => router.push(`/${locale}/buy-sell`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('browseListings')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-gray-400 text-sm">
              {t('showingXofY', { count: listings.length, total })}
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {listings.map((listing) => (
                <Link key={listing.id} href={`/${locale}/buy-sell/${listing.id}`}>
                  <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
                    <div className={viewMode === 'grid' ? '' : 'flex'}>
                      <div className={`${viewMode === 'grid' ? 'aspect-video' : 'w-64'} bg-gray-700 rounded-t-lg overflow-hidden`}>
                        {listing.cover_image ? (
                          <img
                            src={listingImageUrl(listing.cover_image)}
                            alt={`${listing.make} ${listing.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/cars/default-car.jpg'
                              ;(e.target as HTMLImageElement).onerror = null
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                            {t('noImage')}
                          </div>
                        )}
                      </div>
                      <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-white font-semibold text-lg">
                              {listing.year} {listing.make} {listing.model}
                            </h3>
                            <p className="text-blue-400 font-bold text-xl">
                              ${listing.price?.toLocaleString()}
                            </p>
                          </div>
                          <FavoriteButton
                            listingId={listing.id}
                            initialFavorite={true}
                            size="md"
                            onToggle={(isFavorite) => {
                              if (!isFavorite) {
                                setListings(listings.filter(l => l.id !== listing.id))
                                setTotal(total - 1)
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <p>{listing.mileage?.toLocaleString()} {listing.mileage_unit}</p>
                          <p className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {listing.location_city}, {listing.location_state}
                          </p>
                          <p className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatTimeAgo(listing.saved_at || listing.created_at)}
                          </p>
                        </div>
                        <div className="mt-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            listing.condition === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                            listing.condition === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                            listing.condition === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {listing.condition}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            {/* Pagination */}
            {total > 15 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-600 text-gray-300"
                >
                  {t('previous')}
                </Button>
                <span className="px-4 py-2 text-gray-300">
                  {t('pageOf', { page, total: Math.ceil(total / 15) })}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 15 >= total}
                  className="border-gray-600 text-gray-300"
                >
                  {t('next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
