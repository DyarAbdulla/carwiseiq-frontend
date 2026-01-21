"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { 
  Eye, Heart, Trash2, BarChart3, Plus, Filter, CheckCircle2
} from 'lucide-react'
import { formatCurrency, listingImageUrl } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ListingCardSkeleton } from '@/components/common/LoadingSkeleton'

interface Listing {
  id: number
  make: string
  model: string
  year: number
  price: number
  status: 'active' | 'draft' | 'sold' | 'expired'
  views_count: number
  contacts_count: number
  saves_count: number
  images: Array<{ url: string; is_primary: boolean }>
  created_at: string
}

interface DashboardStats {
  total_listings: number
  total_views: number
  total_messages: number
  average_response_time: string
}

export default function MyListingsPage() {
  const router = useRouter()
  const locale = useLocale() || 'en'
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.getMyListings(statusFilter === 'all' ? undefined : statusFilter)
      setListings(data.listings || [])
      setStats(data.stats || null)
    } catch (error: any) {
      console.error('Error loading listings:', error)
      if (toast?.toast) {
        toast.toast({
          title: 'Error',
          description: error.message || 'Failed to load listings',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
      return
    }
    loadListings()
  }, [isAuthenticated, authLoading, statusFilter, loadListings, router, locale])

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    
    try {
      await apiClient.deleteListing(listingId)
      if (toast?.toast) {
        toast.toast({
          title: 'Success',
          description: 'Listing deleted successfully',
        })
      }
      loadListings()
    } catch (error: any) {
      if (toast?.toast) {
        toast.toast({
          title: 'Error',
          description: error.message || 'Failed to delete listing',
          variant: 'destructive',
        })
      }
    }
  }

  const handleMarkAsSold = async (listingId: number) => {
    try {
      await apiClient.markListingAsSold(listingId)
      if (toast?.toast) {
        toast.toast({
          title: 'Success',
          description: 'Listing marked as sold',
        })
      }
      loadListings()
    } catch (error: any) {
      if (toast?.toast) {
        toast.toast({
          title: 'Error',
          description: error.message || 'Failed to update listing',
          variant: 'destructive',
        })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>,
      draft: <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Draft</Badge>,
      sold: <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Sold</Badge>,
      expired: <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  if (authLoading) {
    return (
      <div className="container px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex items-center justify-center min-h-[200px]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }
  if (loading) {
    return (
      <div className="container px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 bg-[#2a2d3a] rounded w-64 animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-[#2a2d3a] rounded animate-pulse"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Listings</h1>
            <p className="text-sm text-[#94a3b8]">Manage your car listings</p>
          </div>
          <Button
            onClick={() => router.push(`/${locale}/sell`)}
            className="bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] hover:from-[#5B7FFF]/90 hover:to-[#8B5CF6]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Listing
          </Button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card className="border-[#2a2d3a] bg-[#1a1d29]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[#94a3b8]">Total Listings</p>
                    <p className="text-2xl font-bold text-white">{stats.total_listings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#2a2d3a] bg-[#1a1d29]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Eye className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[#94a3b8]">Total Views</p>
                    <p className="text-2xl font-bold text-white">{stats.total_views}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-[#2a2d3a] bg-[#1a1d29] text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d29] border-[#2a2d3a]">
              <SelectItem value="all" className="text-white">All Listings</SelectItem>
              <SelectItem value="active" className="text-white">Active</SelectItem>
              <SelectItem value="draft" className="text-white">Draft</SelectItem>
              <SelectItem value="sold" className="text-white">Sold</SelectItem>
              <SelectItem value="expired" className="text-white">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Card className="border-[#2a2d3a] bg-[#1a1d29]">
            <CardContent className="py-12 text-center">
              <p className="text-white/70 mb-4">No listings found</p>
              <Button
                onClick={() => router.push(`/${locale}/sell`)}
                className="bg-gradient-to-r from-[#5B7FFF] to-[#8B5CF6] hover:from-[#5B7FFF]/90 hover:to-[#8B5CF6]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-[#2a2d3a] bg-[#1a1d29] hover:border-[#5B7FFF]/50 transition-all">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-[#5B7FFF]/20 to-[#8B5CF6]/20">
                    {listing.images && listing.images.length > 0 ? (
                      <Image
                        src={listingImageUrl(listing.images[0].url)}
                        alt={`${listing.make} ${listing.model} ${listing.year}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50" aria-label={`${listing.make} ${listing.model}`}>
                        No Image
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(listing.status)}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      {listing.make} {listing.model} {listing.year}
                    </CardTitle>
                    <div className="text-2xl font-bold text-[#5B7FFF] mt-2">
                      {formatCurrency(listing.price)}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-[#94a3b8]">Views</p>
                        <p className="text-sm font-semibold text-white">{listing.views_count}</p>
                      </div>
                      <div className="text-center">
                        <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-[#94a3b8]">Saves</p>
                        <p className="text-sm font-semibold text-white">{listing.saves_count}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => router.push(`/${locale}/buy-sell/${listing.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => router.push(`/${locale}/my-listings/${listing.id}/analytics`)}
                        variant="outline"
                        size="sm"
                        className="border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-white"
                        title="View Analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      {listing.status === 'active' && (
                        <Button
                          onClick={() => handleMarkAsSold(listing.id)}
                          variant="outline"
                          size="sm"
                          className="border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-500"
                          title="Mark as Sold"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteListing(listing.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
