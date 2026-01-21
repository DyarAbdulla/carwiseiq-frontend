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
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers are not supported in this browser')
      return
    }

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
            console.log('[PWA] Service Worker registered successfully:', registration.scope)

            // Check for updates
            try {
              registration.addEventListener('updatefound', () => {
                try {
                  const newWorker = registration.installing
                  if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[PWA] New service worker available. Refresh to update.')
                      }
                    })
                  }
                } catch (err) {
                  console.warn('[PWA] Error in updatefound handler:', err)
                }
              })
            } catch (err) {
              console.warn('[PWA] Error adding updatefound listener:', err)
            }
          })
          .catch((error) => {
            // Safe error logging - don't crash
            console.warn('[PWA] Service Worker registration failed:', error)
            // Silently fail - don't break the app if SW registration fails
          })

        // Listen for controller changes (when a new service worker takes control)
        try {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Service Worker controller changed')
          })
        } catch (err) {
          console.warn('[PWA] Error adding controllerchange listener:', err)
        }
      } catch (error) {
        // Safe error logging for any registration setup errors
        console.warn('[PWA] Error setting up service worker registration:', error)
      }
    } else {
      // DEVELOPMENT (PWA not enabled): Unregister service worker and clear all caches
      const unregisterAndClearCaches = async () => {
        try {
          // Get all service worker registrations
          const registrations = await navigator.serviceWorker.getRegistrations()

          // Unregister all service workers
          for (const registration of registrations) {
            try {
              const unregistered = await registration.unregister()
              if (unregistered) {
                console.log('[PWA Dev] Service Worker unregistered:', registration.scope)
              }
            } catch (err) {
              console.warn('[PWA Dev] Error unregistering service worker:', err)
            }
          }

          // Clear all caches
          try {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map((cacheName) => {
                try {
                  console.log('[PWA Dev] Deleting cache:', cacheName)
                  return caches.delete(cacheName)
                } catch (err) {
                  console.warn('[PWA Dev] Error deleting cache:', cacheName, err)
                  return Promise.resolve()
                }
              })
            )
          } catch (err) {
            console.warn('[PWA Dev] Error getting cache names:', err)
          }

          console.log('[PWA Dev] All service workers unregistered and caches cleared')
        } catch (error) {
          // Safe error logging - don't crash
          console.warn('[PWA Dev] Error unregistering service workers or clearing caches:', error)
        }
      }

      unregisterAndClearCaches()
    }
  }, []) // Empty dependency array - only run once on mount

  // This component doesn't render anything
  return null
}
