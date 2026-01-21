'use client'

import { useEffect } from 'react'

/**
 * PWARegister Component
 * Safely registers the service worker in the browser
 * - Only registers when: NODE_ENV === 'production' OR NEXT_PUBLIC_ENABLE_PWA === 'true'
 * - In development (without PWA enabled): unregisters SW and clears all caches
 * - This component must be a client component to access browser APIs
 */
export default function PWARegister() {
  useEffect(() => {
    // Guard: Only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Guard: Check if service workers are supported
    if (!('serviceWorker' in navigator)) return

    // Check if PWA should be enabled
    const isProduction = process.env.NODE_ENV === 'production'
    const pwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true'
    const shouldRegisterSW = isProduction || pwaEnabled

    if (shouldRegisterSW) {
      // Register service worker (production or explicitly enabled)
      try {
        navigator.serviceWorker
          .register('/service-worker.js', {
            scope: '/',
          })
          .then((registration) => {
            try {
              registration.addEventListener('updatefound', () => {
                try {
                  const newWorker = registration.installing
                  if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available; app will use it on next load
                      }
                    })
                  }
                } catch {}
              })
            } catch {}
          })
          .catch(() => {})

        // Listen for controller changes (when a new service worker takes control)
        try {
          navigator.serviceWorker.addEventListener('controllerchange', () => {})
        } catch {}
      } catch {}
    } else {
      // DEVELOPMENT (PWA not enabled): Unregister service worker and clear all caches
      const unregisterAndClearCaches = async () => {
        try {
          // Get all service worker registrations
          const registrations = await navigator.serviceWorker.getRegistrations()

          // Unregister all service workers
          for (const registration of registrations) {
            try {
              await registration.unregister()
            } catch {}
          }

          try {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map((name) => caches.delete(name).catch(() => {})))
          } catch {}
        } catch {}
      }

      unregisterAndClearCaches()
    }
  }, []) // Empty dependency array - only run once on mount

  // This component doesn't render anything
  return null
}
