"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const currentValue = value[0] || min

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      onValueChange?.([newValue])
    }

    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div className="relative flex w-full items-center">
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#2a2d3a] outline-none",
            className
          )}
          style={{
            background: `linear-gradient(to right, #5B7FFF 0%, #5B7FFF ${percentage}%, #2a2d3a ${percentage}%, #2a2d3a 100%)`,
          }}
          {...props}
        />
        <div
          className="absolute h-2 rounded-lg bg-[#5B7FFF] pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }

