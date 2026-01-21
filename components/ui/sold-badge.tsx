"use client"

import { cn } from "@/lib/utils"

interface SoldBadgeProps {
  /** "corner" = small badge top-right on image; "overlay" = full centered overlay (e.g. modals) */
  variant?: "corner" | "overlay"
  className?: string
}

export function SoldBadge({ variant = "overlay", className }: SoldBadgeProps) {
  const isCorner = variant === "corner"
  return (
    <div
      className={cn(
        "absolute z-10 pointer-events-none",
        isCorner
          ? "top-2 right-2"
          : "inset-0 flex items-center justify-center rounded-lg bg-black/60",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "rounded font-bold uppercase tracking-wider text-white shadow-lg",
          "bg-red-600/95 border-2 border-white/90",
          isCorner ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-lg"
        )}
      >
        SOLD
      </span>
    </div>
  )
}
