"use client"

import * as React from "react"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void
}>({
  toast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...props, id }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, props.duration || 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex w-full flex-col-reverse p-4 sm:flex-col md:max-w-[420px]">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-[#2a2d3a] bg-[#1a1d29] p-6 pr-8 shadow-lg transition-all"
          >
            <div className="grid gap-1">
              {toastItem.title && (
                <div className="text-sm font-semibold text-white">
                  {toastItem.title}
                </div>
              )}
              {toastItem.description && (
                <div className="text-sm text-[#94a3b8]">
                  {toastItem.description}
                </div>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toastItem.id))}
              className="absolute right-2 top-2 rounded-md p-1 text-[#94a3b8] opacity-0 transition-opacity hover:text-white focus:opacity-100 focus:outline-none group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast: (props: ToastProps) => {
        console.log("Toast:", props.title, props.description)
        if (props.variant === "destructive") {
          console.error("Error:", props.description)
        }
      },
    }
  }
  return context
}
