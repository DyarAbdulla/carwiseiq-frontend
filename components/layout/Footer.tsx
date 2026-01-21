"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 py-10 sm:py-12 lg:py-16 mt-auto">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-6">
          {/* Brand */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-white font-semibold text-base mb-3">{t('brand')}</h3>
            <p className="text-sm text-[#94a3b8]">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-white font-semibold text-base mb-3">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/predict`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('predict')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/compare`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('compare')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/budget`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('budget')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-white font-semibold text-base mb-3">{t('resources')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/docs`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('docs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/stats`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('stats')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-white font-semibold text-base mb-3">{t('legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/privacy`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-[#94a3b8] hover:text-[#5B7FFF] hover:underline transition-all duration-300 py-1.5 block">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              {t('poweredBy')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}


