'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Save, History, Trash2 } from 'lucide-react'
import {
  loadCompareHistory,
  deleteCompareFromHistory,
  defaultCompareName,
  type CompareHistoryEntry,
} from '@/lib/compareHistory'

interface CompareSaveAndHistoryProps {
  canSave: boolean
  onSave: (name: string) => void
  onLoad: (entry: CompareHistoryEntry) => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  className?: string
}

export function CompareSaveAndHistory({
  canSave,
  onSave,
  onLoad,
  disabled = false,
  variant = 'outline',
  className = '',
}: CompareSaveAndHistoryProps) {
  const [entries, setEntries] = useState<CompareHistoryEntry[]>([])
  const [histOpen, setHistOpen] = useState(false)

  const refresh = useCallback(() => setEntries(loadCompareHistory()), [])

  useEffect(() => {
    if (histOpen) refresh()
  }, [histOpen, refresh])

  const handleSave = () => {
    if (!canSave) return
    const name = typeof window !== 'undefined' ? window.prompt('Name this comparison', defaultCompareName()) : null
    if (name?.trim()) {
      onSave(name.trim())
      refresh()
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteCompareFromHistory(id)
    refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        disabled={disabled || !canSave}
        onClick={handleSave}
        className={className}
      >
        <Save className="h-4 w-4 me-2" />
        Save
      </Button>
      <DropdownMenu open={histOpen} onOpenChange={setHistOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} disabled={disabled} className={className}>
            <History className="h-4 w-4 me-2" />
            History
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto border-[#2a2d3a] bg-[#1a1d29]">
          {entries.length === 0 ? (
            <div className="px-3 py-4 text-sm text-[#94a3b8]">No saved comparisons</div>
          ) : (
            entries.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onClick={() => { onLoad(e); setHistOpen(false) }}
                className="text-white focus:bg-[#2a2d3a] focus:text-white flex items-center justify-between gap-2"
              >
                <span className="truncate">{e.name}</span>
                <span className="text-xs text-[#94a3b8] shrink-0">
                  {new Date(e.savedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={(ev) => handleDelete(ev, e.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-[#94a3b8] hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
