"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { SelectTrigger, SelectValue } from "./select"
import { Input } from "./input"
import { Search, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SearchableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
  emptyMessage = "No results found",
  searchPlaceholder = "Type to search...",
  className
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<string | undefined>(undefined)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Display: use controlled value when provided, otherwise internal (uncontrolled)
  const displayValue = value !== undefined ? value : internalValue

  // Filter options based on search term (case-insensitive, partial match)
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options

    const term = searchTerm.toLowerCase().trim()
    return options.filter(option =>
      option.toLowerCase().includes(term)
    )
  }, [options, searchTerm])

  // Highlight matching text
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>

    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  }

  React.useEffect(() => {
    if (open) {
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // Clear search when dropdown closes
      setSearchTerm("")
    }
  }, [open])

  // Sync internal value when controlled value changes (e.g. form reset)
  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value)
  }, [value])

  const handleSelectValue = React.useCallback(
    (val: string) => {
      setInternalValue(val)
      onValueChange?.(val)
      setOpen(false)
      setSearchTerm("")
    },
    [onValueChange]
  )

  return (
    <div className="relative w-full">
      <SelectPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        value={internalValue}
        onValueChange={handleSelectValue}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full min-h-[44px] py-3 md:py-2 rounded-input [touch-action:manipulation]", className)}>
          {displayValue ? (
            <span className="block truncate">{displayValue}</span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position={isMobile ? "item-aligned" : "popper"}
            side={isMobile ? undefined : "bottom"}
            align={isMobile ? undefined : "start"}
            sideOffset={isMobile ? undefined : 4}
            className={cn(
              "z-[1000] min-w-[var(--radix-select-trigger-width,8rem)] w-full max-w-[100vw] overflow-hidden rounded-card border border-slate-200/80 dark:border-white/10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl text-slate-900 dark:text-slate-100 shadow-glass",
              "max-h-[min(60vh,400px)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              /* Desktop: aligned to trigger; mobile: bottom sheet – override Popper’s inline left/top/transform */
              "max-md:!fixed max-md:!left-0 max-md:!right-0 max-md:!top-auto max-md:!bottom-0 max-md:!z-[1000] max-md:!w-full max-md:!min-w-0 max-md:!max-w-none max-md:!h-[min(60vh,400px)] max-md:!max-h-[min(60vh,400px)] max-md:!transform-none max-md:!flex max-md:!flex-col max-md:!rounded-t-2xl max-md:!rounded-b-none max-md:pb-[env(safe-area-inset-bottom)] max-md:data-[state=open]:slide-in-from-bottom max-md:border-t max-md:!pointer-events-auto max-md:touch-manipulation"
            )}
          >
            {/* Bottom sheet drag handle on mobile */}
            <div className="flex justify-center pt-2.5 pb-1 md:hidden shrink-0" aria-hidden>
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            {/* Search: outside Viewport so it doesn’t block item clicks or sticky-overlay */}
            <div className="shrink-0 bg-slate-100 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 min-h-[44px] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === "Escape") {
                      setOpen(false)
                      setSearchTerm("")
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearchTerm("")
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <SelectPrimitive.Viewport
              className={cn(
                "p-1 max-md:!w-full max-md:min-w-0 overflow-y-auto overscroll-contain max-h-[min(60vh,400px)]",
                "max-md:flex-1 max-md:min-h-0 max-md:!max-h-[calc(min(60vh,400px)-4rem)] max-md:overflow-y-auto max-md:!pointer-events-auto"
              )}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelectValue(option)
                    }}
                    className="cursor-pointer max-md:!pointer-events-auto max-md:touch-manipulation"
                  >
                    <SelectPrimitive.Item
                      value={option}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-3 md:py-2 pl-8 pr-3 text-sm min-h-[44px] md:min-h-0 outline-none focus:bg-slate-100 dark:focus:bg-white/10 focus:text-slate-900 dark:focus:text-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [touch-action:manipulation] max-md:!pointer-events-auto max-md:touch-manipulation"
                      )}
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check className="h-4 w-4" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>
                        {searchTerm ? highlightMatch(option, searchTerm) : option}
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {searchTerm.length >= 2
                    ? `No results found for "${searchTerm}"`
                    : emptyMessage
                  }
                </div>
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}
