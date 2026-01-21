"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Input } from "./input"
import { Search, X, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const searchInputRef = React.useRef<HTMLInputElement>(null)

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

  return (
    <div className="relative w-full">
      <SelectPrimitive.Root
        value={value}
        onValueChange={(val) => {
          onValueChange?.(val)
          setOpen(false)
          setSearchTerm("")
        }}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            align="start"
            className={cn(
              "relative z-[9999] max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-white/10 bg-white/[0.03] backdrop-blur-xl text-white shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
            )}
          >
            <SelectPrimitive.Viewport 
              className={cn(
                "p-1",
                "w-full min-w-[var(--radix-select-trigger-width)]"
              )}
            >
            {/* Search Input */}
            <div className="sticky top-0 z-10 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 p-2 mb-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-9 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    // Prevent closing dropdown when typing
                    e.stopPropagation()
                    // Close on Escape
                    if (e.key === 'Escape') {
                      setOpen(false)
                      setSearchTerm("")
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearchTerm("")
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-[240px] overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectPrimitive.Item 
                    key={option} 
                    value={option}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-[#2a2d3a] focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {highlightMatch(option, searchTerm)}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {searchTerm.length >= 2 
                    ? `No results found for "${searchTerm}"`
                    : emptyMessage
                  }
                </div>
              )}
            </div>
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    </div>
  )
}
