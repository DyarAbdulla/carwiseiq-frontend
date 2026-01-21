"use client"

import { useState, useEffect } from "react"

/**
 * Returns whether the given media query matches (e.g. for responsive behavior).
 * On SSR and before mount, returns false (assumes desktop).
 * Matches Tailwind's md breakpoint: (max-width: 768px) = mobile.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
