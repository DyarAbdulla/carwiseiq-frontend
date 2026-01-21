'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type PredictLoadingContextValue = {
  isPredicting: boolean
  setPredicting: (v: boolean) => void
}

const PredictLoadingContext = createContext<PredictLoadingContextValue>({
  isPredicting: false,
  setPredicting: () => {},
})

export function usePredictLoading() {
  const ctx = useContext(PredictLoadingContext)
  return ctx
}

export function PredictLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPredicting, setPredicting] = useState(false)
  const setPredictingStable = useCallback((v: boolean) => setPredicting(v), [])
  return (
    <PredictLoadingContext.Provider value={{ isPredicting, setPredicting: setPredictingStable }}>
      {children}
    </PredictLoadingContext.Provider>
  )
}
