"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Car, Menu, X, Lock, LogIn, UserPlus, LogOut, Plus, Sun, Moon, Sparkles, LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/', labelKey: 'nav.home', icon: Car },
  { href: '/predict', labelKey: 'nav.predict' },
  { href: '/buy-sell', labelKey: 'nav.buySell' },
  { href: '/favorites', labelKey: 'nav.favorites' },
  { href: '/batch', labelKey: 'nav.batch' },
  { href: '/compare', labelKey: 'nav.compare' },
  { href: '/budget', labelKey: 'nav.budget' },
  { href: '/history', labelKey: 'nav.history' },
]

export function Header() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuPortalReady, setMenuPortalReady] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const t = useTranslations()
  const tCommon = useTranslations('common')
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')
  const pathname = usePathname() || ''
  const locale = useLocale() || 'en'
  const isRTL = locale === 'ar' || locale === 'ku'
  const router = useRouter()
  const toastHook = useToast()
  const toast = toastHook || { toast: () => {} }
  const { theme, setTheme } = useTheme()

  const auth = useAuth()
  const user = auth?.user || null
  const handleLogout = auth?.logout || null
  const isAuthenticated = auth?.isAuthenticated || false

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => { if (mobileMenuOpen) setMenuPortalReady(true) }, [mobileMenuOpen])

  // When mobile menu opens: lock body scroll and compensate scrollbar to avoid viewport width shift
  useEffect(() => {
    if (!mobileMenuOpen) return
    const sb = typeof window !== 'undefined' ? window.innerWidth - document.documentElement.clientWidth : 0
    const prevOverflow = document.body.style.overflow
    const prevPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${sb}px`
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPadding
    }
  }, [mobileMenuOpen])

  // Auto-hide navbar on scroll down, show on scroll up (mobile/tablet only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastScrollY && y > 80) setHeaderVisible(false)
      else setHeaderVisible(true)
      setLastScrollY(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  const basePathname = pathname ? pathname.replace(new RegExp(`^/${locale}`), '') || '/' : '/'

  // isActive: exact match for home; for others match exact or nested (e.g. /buy-sell/123)
  const isActiveNav = (href: string) =>
    href === '/' ? (basePathname === '/' || basePathname === '') : (basePathname === href || basePathname.startsWith(href + '/'))

  const handleNavClick = (_href: string) => {}

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full glass-header supports-[backdrop-filter]:bg-slate-900/80">
        <div className="flex h-16 min-h-[44px] items-center justify-between px-4 md:px-6">
          <div className="h-6 w-6 rounded-lg bg-slate-700/50 animate-pulse" />
        </div>
      </header>
    )
  }

  const handleLogin = () => router.push(`/${locale}/login`)
  const handleRegister = () => router.push(`/${locale}/register`)

  const handleLogoutClick = async () => {
    try {
      if (typeof handleLogout === 'function') await handleLogout()
      toast?.toast?.({ title: tCommon?.('success') || 'Success', description: tAuth?.('logoutSuccess') || 'Logged out successfully' })
    } catch {
      toast?.toast?.({ title: tCommon?.('error') || 'Error', description: tAuth?.('logoutError') || 'Failed to logout', variant: 'destructive' })
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-xl bg-slate-950/85 transition-transform duration-300 ease-out lg:transition-none",
        "lg:translate-y-0",
        !headerVisible && "max-lg:-translate-y-full"
      )}
    >
      <div className="flex h-16 min-h-[44px] items-center justify-between gap-4 px-4 sm:px-6 max-w-[1800px] mx-auto">
        {/* Logo (left): links to home; 40px height, responsive */}
        <Link href={`/${locale || 'en'}`} className="flex items-center gap-3 shrink-0 min-w-0">
          <Image
            src="/logo.png"
            alt="CarWiseIQ"
            width={180}
            height={40}
            className="h-10 object-contain"
            priority
          />
          <span className="font-bold text-slate-900 dark:text-slate-100 hidden sm:inline truncate text-lg">
            <span className="font-extrabold">CarWise</span>
            <span className="font-bold text-indigo-400 dark:text-indigo-300">IQ</span>
          </span>
        </Link>

        {/* Desktop nav (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "min-h-[44px] flex items-center px-4 py-2 rounded-input text-sm font-medium transition-all duration-200",
                isActiveNav(item.href)
                  ? "text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/10 shadow-soft"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-white/5"
              )}
            >
              {tKey(t, item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop: Messages, Sell, Theme, Language, Auth. Mobile: only hamburger (rest in menu) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <Button
              onClick={() => router.push(`/${locale}/sell/step1`)}
              className="inline-flex items-center gap-2 h-11 min-h-[44px] rounded-input bg-indigo-600 hover:bg-indigo-500 text-white shadow-soft"
            >
              <Plus className="h-4 w-4" />
              {t('nav.sellCar')}
            </Button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-11 min-h-[44px] w-11 items-center justify-center rounded-input border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-400"
              aria-label={theme === 'dark' ? tCommon('themeLight') : tCommon('themeDark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <LanguageSelector variant="inline" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 min-h-[44px] w-11 rounded-input border border-slate-200/60 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10"
                >
                  <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-card border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-glass">
                {isAuthenticated && user?.email ? (
                  <>
                    <DropdownMenuLabel className="text-slate-600 dark:text-slate-400">{user.email || tAuth('user')}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-200/60 dark:bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/dashboard`} className="cursor-pointer text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-white/10 flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        My Cars
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogoutClick} className="cursor-pointer text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-white/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      {tAuth('logout')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleLogin} className="cursor-pointer text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-white/10">
                      <LogIn className="mr-2 h-4 w-4" />
                      {tSidebar?.('account.login') || 'Login'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRegister} className="cursor-pointer text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-white/10">
                      <UserPlus className="mr-2 h-4 w-4" />
                      {tSidebar?.('account.register') || 'Register'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: hamburger only (≥44px) */}
          <div style={{ fontSize: '16px' }} className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 min-h-[44px] min-w-[44px] w-11 rounded-input touch-manipulation tap-highlight-transparent"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onTouchStart={(e) => { e.currentTarget.style.fontSize = '16px' }}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? tCommon('closeMenu') : tCommon('openMenu')}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: right-side drawer (portaled to body + fixed + 100dvh + safe-area; no transform on ancestors) */}
      {menuPortalReady && typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={() => setMenuPortalReady(false)}>
          {mobileMenuOpen ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden touch-manipulation tap-highlight-transparent"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={-1}
              />
              <div className={cn("fixed inset-0 z-[101] flex pointer-events-none lg:hidden", isRTL ? 'justify-start' : 'justify-end')}>
                <motion.div
                  initial={{ x: isRTL ? '-100%' : '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: isRTL ? '-100%' : '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className={cn("h-[100dvh] min-h-[100vh] w-[100vw] max-w-[360px] bg-slate-950/95 text-white shadow-2xl pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] overflow-y-auto overscroll-contain pointer-events-auto touch-manipulation tap-highlight-transparent", isRTL ? 'border-r border-white/10' : 'border-l border-white/10')}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Sticky header: title + close */}
                  <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-md bg-slate-950/80 border-b border-white/5">
                    <span className="text-base font-semibold text-white">{t('nav.menu') || 'Menu'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label={tCommon('closeMenu')}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="px-3 py-4 space-y-1">
                    {/* Top: Language + Theme */}
                    <div className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-300 block mb-2">{tCommon('language')}</span>
                      <LanguageSelector variant="inline" />
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] w-full text-sm font-medium transition-colors",
                        "hover:bg-white/10 active:bg-white/10 text-slate-200"
                      )}
                      aria-label={theme === 'dark' ? tCommon('themeLight') : tCommon('themeDark')}
                    >
                      {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0 text-slate-400" /> : <Moon className="h-5 w-5 shrink-0 text-slate-400" />}
                      <span>{theme === 'dark' ? tCommon('themeLight') : tCommon('themeDark')}</span>
                    </button>

                    {/* Main: Sell Car (primary CTA) + Nav */}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium transition-colors cursor-pointer",
                        "hover:bg-white/10 active:bg-white/10",
                        "bg-indigo-600 hover:bg-indigo-500 text-white"
                      )}
                      onClick={() => { setMobileMenuOpen(false); router.push(`/${locale}/sell/step1`) }}
                      role="button"
                    >
                      <Plus className="h-5 w-5 shrink-0" />
                      <span>{t('nav.sellCar')}</span>
                    </div>
                    <nav className="space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={`/${locale}${item.href}`}
                          onClick={() => { handleNavClick(item.href); setMobileMenuOpen(false) }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium transition-colors",
                            "hover:bg-white/10 active:bg-white/10",
                            isActiveNav(item.href) ? "bg-white/15 text-white" : "text-slate-300"
                          )}
                        >
                          {'icon' in item && item.icon && <item.icon className={cn("h-5 w-5 shrink-0", isActiveNav(item.href) ? "text-white" : "text-slate-400")} />}
                          <span>{tKey(t, item.labelKey)}</span>
                        </Link>
                      ))}
                    </nav>

                    {/* Bottom: divider + (My Cars, Logout) when auth OR (Login, Register) when not */}
                    <div className="border-t border-white/10 my-3" role="separator" />
                    {isAuthenticated ? (
                      <>
                        <Link
                          href={`/${locale}/dashboard`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] w-full text-start text-sm font-medium transition-colors",
                            "hover:bg-white/10 active:bg-white/10 text-slate-200"
                          )}
                        >
                          <LayoutDashboard className="h-5 w-5 shrink-0 text-slate-400" />
                          <span>My Cars</span>
                        </Link>
                        <button
                          onClick={() => { handleLogoutClick(); setMobileMenuOpen(false) }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] w-full text-start text-sm font-medium transition-colors",
                            "hover:bg-white/10 active:bg-white/10 text-slate-200"
                          )}
                        >
                          <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
                          <span>{tAuth('logout')}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium transition-colors hover:bg-white/10 active:bg-white/10 text-slate-200")}>
                          <LogIn className="h-5 w-5 shrink-0 text-slate-400" />
                          <span>{tSidebar?.('account.login') || 'Login'}</span>
                        </Link>
                        <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium transition-colors hover:bg-white/10 active:bg-white/10 text-slate-200")}>
                          <UserPlus className="h-5 w-5 shrink-0 text-slate-400" />
                          <span>{tSidebar?.('account.register') || 'Register'}</span>
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body
      )}
    </header>
  )
}
