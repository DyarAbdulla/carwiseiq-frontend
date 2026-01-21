/**
 * Save/load compare history from localStorage.
 * Key: car-compare-history
 */

export type CompareHistoryMode = 'marketplace' | 'prediction'

export interface CompareHistoryEntry {
  id: string
  name: string
  savedAt: number
  mode: CompareHistoryMode
  ids?: number[]
  state?: { cars: Array<{ features: unknown; prediction: unknown }> }
}

const KEY = 'car-compare-history'
const MAX = 20

function loadRaw(): CompareHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const s = window.localStorage.getItem(KEY)
    if (!s) return []
    const arr = JSON.parse(s) as unknown[]
    return Array.isArray(arr) ? arr.filter((e): e is CompareHistoryEntry => e != null && typeof e === 'object' && typeof (e as CompareHistoryEntry).id === 'string') : []
  } catch {
    return []
  }
}

function saveRaw(entries: CompareHistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)))
  } catch {
    // ignore
  }
}

export function loadCompareHistory(): CompareHistoryEntry[] {
  return loadRaw()
}

export function saveCompareToHistory(entry: Omit<CompareHistoryEntry, 'id' | 'savedAt'>): string {
  const list = loadRaw()
  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const full: CompareHistoryEntry = { ...entry, id, savedAt: Date.now() }
  saveRaw([full, ...list])
  return id
}

export function deleteCompareFromHistory(id: string): void {
  saveRaw(loadRaw().filter(e => e.id !== id))
}

export function defaultCompareName(): string {
  const d = new Date()
  return `Comparison ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
