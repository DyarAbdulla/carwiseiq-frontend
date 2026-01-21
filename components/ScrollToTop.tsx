'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Scrolls the window to top when the route changes.
 * Prevents content from appearing "blank" when navigating from a scrolled position.
 */
export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}
