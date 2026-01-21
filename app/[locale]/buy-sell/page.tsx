"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Grid, List, MapPin, Calendar, Filter, X } from 'lucide-react'
import { apiClient } from '@/lib/api'
import Link from 'next/link'
import { FavoriteButton } from '@/components/marketplace/FavoriteButton'
import { listingImageUrl } from '@/lib/utils'
import { SoldBadge } from '@/components/ui/sold-badge'

export default function BuySellPage() {
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    makes: [] as string[],
    min_year: '',
    max_year: '',
    max_mileage: '',
    conditions: [] as string[],
    transmissions: [] as string[],
    fuel_types: [] as string[],
  })
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('marketplace')

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        page_size: 15,
        search: search || undefined,
        min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
        max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
        makes: filters.makes.length > 0 ? filters.makes.join(',') : undefined,
        min_year: filters.min_year ? parseInt(filters.min_year) : undefined,
        max_year: filters.max_year ? parseInt(filters.max_year) : undefined,
        max_mileage: filters.max_mileage ? parseFloat(filters.max_mileage) : undefined,
        conditions: filters.conditions.length > 0 ? filters.conditions.join(',') : undefined,
        transmissions: filters.transmissions.length > 0 ? filters.transmissions.join(',') : undefined,
        fuel_types: filters.fuel_types.length > 0 ? filters.fuel_types.join(',') : undefined,
      }
      const data = await apiClient.searchListings(params)
      setListings(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filters, search])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffMs = now.getTime() - posted.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return t('postedMinutesAgo', { n: diffMins })
    if (diffHours < 24) return t('postedHoursAgo', { n: diffHours })
    if (diffDays < 30) return t('postedDaysAgo', { n: diffDays })
    return t('postedMonthsAgo', { n: Math.floor(diffDays / 30) })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute start-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadListings()}
                placeholder={t('searchPlaceholder')}
                className="ps-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant="outline"
              className="border-gray-600 text-gray-300 inline-flex justify-start gap-2"
            >
              <Filter className="h-4 w-4 shrink-0" />
              {t('filters')}
            </Button>
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
        </div>

        {/* Filters Sidebar */}
        {filtersOpen && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{t('filters')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltersOpen(false)}
                  className="text-gray-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">{t('priceRange')}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('min')}
                      value={filters.min_price}
                      onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="number"
                      placeholder={t('max')}
                      value={filters.max_price}
                      onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">{t('yearRange')}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('min')}
                      value={filters.min_year}
                      onChange={(e) => setFilters({ ...filters, min_year: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="number"
                      placeholder={t('max')}
                      value={filters.max_year}
                      onChange={(e) => setFilters({ ...filters, max_year: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">{t('maxMileage')}</label>
                  <Input
                    type="number"
                    placeholder={t('maxMileagePlaceholder')}
                    value={filters.max_mileage}
                    onChange={(e) => setFilters({ ...filters, max_mileage: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => {
                    setFilters({
                      min_price: '', max_price: '', makes: [], min_year: '', max_year: '',
                      max_mileage: '', conditions: [], transmissions: [], fuel_types: []
                    })
                    setPage(1)
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  {t('clearAll')}
                </Button>
                <Button
                  onClick={() => {
                    setPage(1)
                    loadListings()
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('applyFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">{t('loading')}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-4">{t('noListings')}</p>
            <Button
              onClick={() => router.push(`/${locale}/sell/step1`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('postFirst')}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-400 text-sm">
              {t('showingRange', { from: ((page - 1) * 15) + 1, to: Math.min(page * 15, total), total })}
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {listings.map((listing) => {
                const isSold = listing.status === 'sold' || listing.status === 'Sold'
                return (
                <Card key={listing.id} className={`bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors ${isSold ? 'opacity-75' : ''}`}>
                  <div className={viewMode === 'grid' ? 'flex flex-col' : 'flex'}>
                    <Link
                      href={`/${locale}/buy-sell/${listing.id}`}
                      className={`flex min-w-0 cursor-pointer ${viewMode === 'grid' ? 'flex-col' : 'flex-1'}`}
                    >
                      <div className={`${viewMode === 'grid' ? 'aspect-video' : 'w-64 shrink-0'} relative bg-gray-700 overflow-hidden ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-l-lg'}`}>
                        {(listing.cover_thumbnail_url || listing.cover_image) ? (
                          <img
                            src={listingImageUrl(listing.cover_thumbnail_url || listing.cover_image)}
                            alt={`${listing.make} ${listing.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/cars/default-car.jpg'
                              ;(e.target as HTMLImageElement).onerror = null
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm min-h-[120px]">
                            {t('noImage')}
                          </div>
                        )}
                        {isSold && <SoldBadge variant="corner" />}
                      </div>
                      <div className={`p-4 flex-1 min-w-0 ${viewMode === 'list' ? '' : ''}`}>
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
                            initialFavorite={listing.is_saved}
                            size="md"
                            onToggle={(isFavorite) => {
                              listing.is_saved = isFavorite
                            }}
                          />
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <p>{listing.mileage?.toLocaleString()} {listing.mileage_unit}</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {listing.location_city}, {listing.location_state}
                          </p>
                          <p className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatTimeAgo(listing.created_at)}
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
                      </div>
                    </Link>
                  </div>
                </Card>
              );})}
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
