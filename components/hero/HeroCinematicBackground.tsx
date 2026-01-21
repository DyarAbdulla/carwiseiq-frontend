"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'

export function HeroCinematicBackground() {
  const [currentScene, setCurrentScene] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    // Crossfade between scenes every 7 seconds (if motion is not reduced)
    if (!mediaQuery.matches) {
      const interval = setInterval(() => {
        setCurrentScene((prev) => (prev === 0 ? 1 : 0))
      }, 7000)

      return () => {
        clearInterval(interval)
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Scene 1: car-hero-1 (left) + car-hero-2 (right) */}
      <div
        className={`absolute inset-0 ${currentScene === 0 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1000ms]`}
        style={{ transition: reducedMotion ? 'none' : 'opacity 1000ms ease-in-out' }}
      >
        {/* Desktop: Left car (car-hero-1) */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-[58%] heroMaskLeft">
          <Image
            src="/images/hero/car-hero-1.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 0}
            quality={85}
            sizes="58vw"
            style={{
              objectPosition: 'center',
              opacity: 0.19,
              filter: 'blur(0.5px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>

        {/* Desktop: Right car (car-hero-2) */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-[58%] heroMaskRight">
          <Image
            src="/images/hero/car-hero-2.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 0}
            quality={85}
            sizes="58vw"
            style={{
              objectPosition: 'center',
              opacity: 0.19,
              filter: 'blur(0.5px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>

        {/* Mobile: Single car image (car-hero-1) */}
        <div className="md:hidden absolute inset-0">
          <Image
            src="/images/hero/car-hero-1.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 0}
            quality={85}
            sizes="100vw"
            style={{
              objectPosition: 'center',
              opacity: 0.15,
              filter: 'blur(1px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Scene 2: car-hero-3 (left) + car-hero-4 (right) */}
      <div
        className={`absolute inset-0 ${currentScene === 1 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1000ms]`}
        style={{ transition: reducedMotion ? 'none' : 'opacity 1000ms ease-in-out' }}
      >
        {/* Desktop: Left car (car-hero-3) */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-[58%] heroMaskLeft">
          <Image
            src="/images/hero/car-hero-3.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 1}
            quality={85}
            sizes="58vw"
            style={{
              objectPosition: 'center',
              opacity: 0.19,
              filter: 'blur(0.5px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>

        {/* Desktop: Right car (car-hero-4) */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-[58%] heroMaskRight">
          <Image
            src="/images/hero/car-hero-4.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 1}
            quality={85}
            sizes="58vw"
            style={{
              objectPosition: 'center',
              opacity: 0.19,
              filter: 'blur(0.5px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>

        {/* Mobile: Single car image (car-hero-3) */}
        <div className="md:hidden absolute inset-0">
          <Image
            src="/images/hero/car-hero-3.jpg"
            alt=""
            fill
            className="object-cover"
            priority={currentScene === 1}
            quality={85}
            sizes="100vw"
            style={{
              objectPosition: 'center',
              opacity: 0.15,
              filter: 'blur(1px) brightness(0.86) contrast(1.12) saturate(0.9)'
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Edge vignette overlay */}
      <div className="absolute inset-0 heroVignette"></div>
    </div>
  )
}
