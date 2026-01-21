"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

const Select = ({ value, onValueChange, disabled, children }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex min-h-[44px] h-11 w-full items-center justify-between rounded-input border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.05] backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/80 dark:hover:bg-white/[0.08]",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={cn("block truncate", className)}
    {...props}
  />
))
SelectValue.displayName = SelectPrimitive.Value.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-[1000] min-w-[var(--radix-select-trigger-width,8rem)] overflow-hidden rounded-card border border-slate-200/80 dark:border-white/10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl text-slate-900 dark:text-slate-100 shadow-glass",
          "max-h-[min(60vh,400px)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "max-md:!transform-none max-md:!fixed max-md:!left-0 max-md:!right-0 max-md:!bottom-0 max-md:!top-auto max-md:!w-full max-md:!min-w-0 max-md:!h-[min(60vh,400px)] max-md:!max-h-[min(60vh,400px)] max-md:!rounded-t-2xl max-md:!rounded-b-none max-md:pb-[env(safe-area-inset-bottom)] max-md:data-[state=open]:slide-in-from-bottom max-md:border-t max-md:!pointer-events-auto max-md:touch-manipulation",
          className
        )}
        {...props}
        position={isMobile ? "item-aligned" : "popper"}
        side={isMobile ? undefined : "bottom"}
        align={isMobile ? undefined : "start"}
        sideOffset={isMobile ? undefined : 4}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1 overflow-y-auto overscroll-contain max-h-[min(60vh,400px)]",
            "max-md:!w-full max-md:min-w-0 max-md:!max-h-[min(60vh,400px)] max-md:overflow-y-auto max-md:!pointer-events-auto"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-3 md:py-2.5 pl-8 pr-3 text-sm min-h-[44px] md:min-h-0 outline-none focus:bg-slate-100 dark:focus:bg-white/10 focus:text-slate-900 dark:focus:text-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [touch-action:manipulation] max-md:!pointer-events-auto max-md:touch-manipulation",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

