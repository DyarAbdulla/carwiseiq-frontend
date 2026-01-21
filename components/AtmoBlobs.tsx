'use client'

import { usePredictLoading } from './PredictLoadingProvider'

export function AtmoBlobs() {
  const { isPredicting } = usePredictLoading()

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -50 }}
      aria-hidden
    >
      <div
        className={`absolute top-0 left-0 w-[400px] h-[400px] blur-[100px] transition-all duration-1000 ${
          isPredicting ? 'animate-atmo-pulse' : ''
        }`}
        style={{
          willChange: 'transform',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className={`absolute bottom-0 right-0 w-[400px] h-[400px] blur-[100px] transition-all duration-1000 ${
          isPredicting ? 'animate-atmo-pulse' : ''
        }`}
        style={{
          willChange: 'transform',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
