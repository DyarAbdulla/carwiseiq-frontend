'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export interface SpecRow {
  label: string
  values: (string | number | undefined | null)[]
  icon?: LucideIcon
  higherIsBetter?: boolean
  lowerIsBetter?: boolean
  format?: (v: string | number) => string
  suffix?: string
}

interface SpecificationTableProps {
  columnLabels: string[]
  rows: SpecRow[]
  winnerIndex?: number
  bestDealIndex?: number
  mostExpensiveIndex?: number
  highlightBestInRow?: boolean
  showIcons?: boolean
  className?: string
}

const defaultFormat = (v: string | number): string =>
  typeof v === 'number' ? (v % 1 === 0 ? String(v) : v.toFixed(1)) : String(v ?? '—')

export function SpecificationTable({
  columnLabels,
  rows,
  winnerIndex,
  bestDealIndex = -1,
  mostExpensiveIndex = -1,
  highlightBestInRow = true,
  showIcons = true,
  className = '',
}: SpecificationTableProps) {
  const resolveClass = (rowIdx: number, colIdx: number, val: string | number | undefined | null): string => {
    const base = 'p-3 text-center text-sm transition-colors'
    const isWinner = winnerIndex === colIdx
    const isBest = bestDealIndex === colIdx
    const isWorst = mostExpensiveIndex === colIdx

    // Column highlight (winner / best deal / most expensive)
    if (isBest) return `${base} bg-green-500/5`
    if (isWorst) return `${base} bg-red-500/5`
    if (isWinner) return `${base} bg-[#5B7FFF]/5`

    if (!highlightBestInRow || val == null || val === '' || typeof val === 'string') return base

    const row = rows[rowIdx]
    const num = typeof val === 'number' ? val : parseFloat(String(val))
    if (isNaN(num)) return base

    const nums = row.values
      .map(x => (typeof x === 'number' ? x : parseFloat(String(x))))
      .filter(n => !isNaN(n))
    if (nums.length < 2) return base

    const useMax = row.higherIsBetter === true
    const best = useMax ? Math.max(...nums) : Math.min(...nums)
    const worst = useMax ? Math.min(...nums) : Math.max(...nums)
    const fmt = (n: number) => (row.format || defaultFormat)(n)
    if (fmt(num) === fmt(best)) return `${base} bg-green-500/10 text-green-400`
    if (fmt(num) === fmt(worst)) return `${base} bg-red-500/10 text-red-400`
    return `${base} bg-amber-500/5 text-amber-200/90`
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-[#2a2d3a] ${className}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2a2d3a] bg-[#0f1117]/80">
            <th className="p-3 text-[#94a3b8] font-semibold text-sm">Specification</th>
            {columnLabels.map((l, i) => (
              <th
                key={i}
                className={`p-3 text-white font-semibold text-sm text-center ${
                  bestDealIndex === i ? 'bg-green-500/10 border-l border-r border-green-500/50' :
                  mostExpensiveIndex === i ? 'bg-red-500/10 border-l border-r border-red-500/50' :
                  'border-[#2a2d3a]'
                }`}
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const Icon = row.icon
            const format = row.format || defaultFormat
            const suffix = row.suffix || ''
            return (
              <motion.tr
                key={ri}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="border-b border-[#2a2d3a] hover:bg-[#2a2d3a]/30"
              >
                <td className="p-3 text-[#94a3b8] font-medium text-sm">
                  <div className="flex items-center gap-2">
                    {showIcons && Icon && <Icon className="h-4 w-4 shrink-0 text-[#5B7FFF]" />}
                    {row.label}
                  </div>
                </td>
                {row.values.map((v, ci) => (
                  <td key={ci} className={resolveClass(ri, ci, v)}>
                    {v != null && v !== '' ? `${format(v as string | number)}${suffix}` : '—'}
                  </td>
                ))}
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
