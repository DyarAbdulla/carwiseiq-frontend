"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Car, Menu, X, Lock, LogIn, UserPlus, LogOut, Plus, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { tKey } from '@/lib/i18n-dev'

const navItems = [
  { href: '/', labelKey: 'nav.home', icon: Car },
  { href: '/predict', labelKey: 'nav.predict' },
  { href: '/buy-sell', labelKey: 'nav.buySell' },
  { href: '/favorites', labelKey: 'nav.favorites' },
  { href: '/batch', labelKey: 'nav.batch' },
  { href: '/compare', labelKey: 'nav.compare' },
  { href: '/budget', labelKey: 'nav.budget' },
  { href: '/stats', labelKey: 'nav.stats' },
  { href: '/history', labelKey: 'nav.history' },
  { href: '/docs', labelKey: 'nav.docs' },
]

export function Header() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Hooks must be called unconditionally (React rules)
  const t = useTranslations()
  const tCommon = useTranslations('common')
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')
  const pathname = usePathname() || ''
  const locale = useLocale() || 'en'
  const router = useRouter()
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }

  // Auth hook - MUST be called unconditionally (no try-catch)
  const auth = useAuth()
  const user = auth?.user || null
  const handleLogout = auth?.logout || null
  const isAuthenticated = auth?.isAuthenticated || false

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load unread message count
  useEffect(() => {
    if (!isAuthenticated) return

    const loadUnreadCount = async () => {
      try {
        const count = await apiClient.getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        // Ignore errors
      }
    }

    loadUnreadCount()
    // Poll for unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const basePathname = pathname ? pathname.replace(`/${locale}`, '') || '/' : '/'

  // Don't render until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[#2a2d3a] bg-[#1a1d29]/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="h-6 w-6 bg-[#2a2d3a] rounded animate-pulse" />
        </div>
      </header>
    )
  }

  const handleLogin = () => {
    router.push(`/${locale}/login`)
  }

  const handleRegister = () => {
    router.push(`/${locale}/register`)
  }

  const handleLogoutClick = async () => {
    try {
      if (handleLogout && typeof handleLogout === 'function') {
        await handleLogout()
      }
      if (toast && typeof toast.toast === 'function') {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('success') : null) || 'Success',
          description: (tAuth && typeof tAuth === 'function' ? tAuth('logoutSuccess') : null) || 'Logged out successfully',
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      if (toast && typeof toast.toast === 'function') {
        toast.toast({
          title: (tCommon && typeof tCommon === 'function' ? tCommon('error') : null) || 'Error',
          description: (tAuth && typeof tAuth === 'function' ? tAuth('logoutError') : null) || 'Failed to logout',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2d3a] bg-[#1a1d29]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1d29]/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href={`/${locale || 'en'}`} className="flex items-center space-x-2">
          <Car className="h-6 w-6 text-[#5B7FFF]" />
          <span className="font-bold text-lg">{(t && typeof t === 'function' ? t('common.appName') : null) || 'Car Price Predictor Pro'}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const isActive = basePathname === item.href
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={cn(
                  "text-sm font-medium transition-colors px-3 py-2 rounded-md min-h-[48px] flex items-center",
                  isActive
                    ? "text-[#5B7FFF] bg-[#5B7FFF]/10 border-b-2 border-[#5B7FFF]"
                    : "text-[#94a3b8] hover:text-white hover:bg-[#2a2d3a]"
                )}
              >
                {tKey(t, item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Messages Link with Badge */}
          {isAuthenticated && (
            <Link
              href={`/${locale}/messages`}
              className="relative hidden md:flex items-center justify-center h-9 w-9 border border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] rounded-md transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-[#94a3b8]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* + Sell Car Button */}
          <Button
            onClick={() => router.push(`/${locale}/sell/step1`)}
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {t('nav.sellCar')}
          </Button>

          <LanguageSelector />

          {/* Account Lock Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] rounded-md"
              >
                <Lock className="h-4 w-4 text-[#94a3b8]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1d29] border-[#2a2d3a]">
                  {isAuthenticated && user && user.email ? (
                <>
                  <DropdownMenuLabel className="text-[#94a3b8]">
                    {user.email || tAuth('user')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2d3a]" />
                  <DropdownMenuItem
                    onClick={handleLogoutClick}
                    className="cursor-pointer text-white hover:bg-[#2a2d3a] focus:bg-[#2a2d3a]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tAuth('logout')}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={handleLogin}
                    className="cursor-pointer text-white hover:bg-[#2a2d3a] focus:bg-[#2a2d3a]"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {(tSidebar && typeof tSidebar === 'function' ? tSidebar('account.login') : null) || 'Login'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRegister}
                    className="cursor-pointer text-white hover:bg-[#2a2d3a] focus:bg-[#2a2d3a]"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {(tSidebar && typeof tSidebar === 'function' ? tSidebar('account.register') : null) || 'Register'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2a2d3a] bg-[#1a1d29]">
          <div className="px-4 py-3 border-b border-[#2a2d3a] space-y-2">
            {isAuthenticated && (
              <Link
                href={`/${locale}/messages`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium bg-[#2a2d3a] text-[#94a3b8] hover:text-white"
              >
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('nav.messages')}
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Button
              onClick={() => {
                setMobileMenuOpen(false)
                router.push(`/${locale}/sell/step1`)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('nav.sellCar')}
            </Button>
          </div>
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = basePathname === item.href
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-md text-sm font-medium transition-colors min-h-[48px] flex items-center",
                    isActive
                      ? "bg-[#5B7FFF]/20 text-[#5B7FFF] border-l-4 border-[#5B7FFF]"
                      : "text-[#94a3b8] hover:bg-[#2a2d3a] hover:text-white"
                  )}
                >
                  {tKey(t, item.labelKey)}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

