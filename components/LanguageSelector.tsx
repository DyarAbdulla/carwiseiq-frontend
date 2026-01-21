"use client"

import { useLocale } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { locales } from '@/i18n'
import { Globe, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const languageLabels: Record<string, string> = {
  en: 'English',
  ku: 'Kurdish',
  ar: 'Arabic',
}

const localeCodes: Record<string, string> = {
  en: 'us',
  ku: 'ku',
  ar: 'sa',
}

export function LanguageSelector() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchLocale = (newLocale: string) => {
    // Get current pathname without locale prefix
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    // Build new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    // Preserve query parameters
    const queryString = searchParams.toString()
    const fullPath = queryString ? `${newPath}?${queryString}` : newPath
    
    router.push(fullPath)
  }

  const currentLabel = languageLabels[locale] || locale
  const currentCode = localeCodes[locale] || locale

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-md border border-[#2a2d3a] bg-[#1a1d29] hover:bg-[#2a2d3a] text-sm font-medium text-[#94a3b8] hover:text-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#5B7FFF] focus:ring-offset-2 focus:ring-offset-[#1a1d29]"
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="lowercase">{currentCode}</span>
          <span>{currentLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#1a1d29] border-[#2a2d3a]">
        {locales.map((loc) => {
          const label = languageLabels[loc] || loc
          const code = localeCodes[loc] || loc
          const isSelected = locale === loc
          
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => switchLocale(loc)}
              className={cn(
                "cursor-pointer text-white hover:bg-[#2a2d3a] focus:bg-[#2a2d3a]",
                isSelected && "bg-[#2a2d3a]/50"
              )}
            >
              <span className="lowercase mr-2">{code}</span>
              {label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


