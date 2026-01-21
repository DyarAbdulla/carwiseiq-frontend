"use client"

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

interface FavoriteButtonProps {
  listingId: number
  initialFavorite?: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onToggle?: (isFavorite: boolean) => void
}

export function FavoriteButton({
  listingId,
  initialFavorite = false,
  size = 'md',
  showText = false,
  onToggle
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const locale = useLocale()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isToggling, setIsToggling] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isAuthenticated && listingId) {
      checkFavorite()
    } else {
      // Check localStorage for guest users
      const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites') || '[]')
      setIsFavorite(guestFavorites.includes(listingId))
    }
  }, [listingId, isAuthenticated])

  const checkFavorite = async () => {
    try {
      const data = await apiClient.checkFavorite(listingId)
      setIsFavorite(data.is_favorite)
    } catch (error) {
      // Ignore errors
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorites',
        variant: 'destructive'
      })
      router.push(`/${locale}/login`)
      return
    }

    setIsToggling(true)
    setAnimate(true)

    try {
      const data = await apiClient.toggleFavorite(listingId)
      setIsFavorite(data.is_favorite)
      
      if (onToggle) {
        onToggle(data.is_favorite)
      }

      toast({
        title: data.is_favorite ? 'Added to favorites' : 'Removed from favorites',
        description: data.is_favorite 
          ? 'You can view it in your favorites page' 
          : 'Removed from your favorites'
      })

      // Reset animation after a short delay
      setTimeout(() => setAnimate(false), 300)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorite',
        variant: 'destructive'
      })
      setAnimate(false)
    } finally {
      setIsToggling(false)
    }
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`relative ${showText ? 'flex items-center gap-2' : ''} ${
        isFavorite ? 'text-red-500' : 'text-gray-400'
      } hover:text-red-500 transition-colors disabled:opacity-50`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.div
        animate={animate ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={`${sizeClasses[size]} ${isFavorite ? 'fill-current' : ''}`} />
      </motion.div>
      {showText && (
        <span className="text-sm">
          {isFavorite ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}
