/**
 * Export compare data to PDF using jspdf and jspdf-autotable.
 * Filename: car-comparison-YYYY-MM-DD.pdf
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './utils'

export interface ExportSpecRow {
  label: string
  values: (string | number | undefined | null)[]
  format?: (v: string | number) => string
  suffix?: string
}

export interface ExportCompareData {
  mode: 'prediction' | 'marketplace'
  columnLabels: string[]
  specRows: ExportSpecRow[]
  summary: { name: string; price: number; savings: number }[]
  chartSummary?: { name: string; price: number; horsepower?: number; hp?: number; fuelEconomy?: number; mpg?: number }[]
  recommendation: string
}

const fmt = (v: string | number | null | undefined, row?: ExportSpecRow): string => {
  if (v == null || v === '') return '—'
  const s = typeof v === 'number' ? (row?.format ? row.format(v) : (v % 1 === 0 ? String(v) : v.toFixed(1))) : String(v)
  return s + (row?.suffix || '')
}

export async function exportToPDF(data: ExportCompareData): Promise<void> {
  const doc = new jsPDF()
  const pageW = (doc as unknown as { internal?: { pageSize?: { width?: number } } }).internal?.pageSize?.width ?? 210
  const margin = 14
  let y = 20

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Car Comparison Report', margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y)
  y += 12

  // Summary table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', margin, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Car', 'Price', 'Savings vs Highest']],
    body: data.summary.map(s => [s.name, formatCurrency(s.price), s.savings > 0 ? formatCurrency(s.savings) : '—']),
    theme: 'grid',
    headStyles: { fillColor: [91, 127, 255], textColor: 255 },
    margin: { left: margin, right: margin },
  })
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10

  // Chart summary (price, hp, fuel economy L/100km)
  if (data.chartSummary && data.chartSummary.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Quick comparison', margin, y)
    y += 6
    const hasHp = data.chartSummary.some(c => ((c.horsepower ?? c.hp) ?? 0) > 0)
    const hasFe = data.chartSummary.some(c => ((c.fuelEconomy ?? c.mpg) ?? 0) > 0)
    const head = ['Car', 'Price', ...(hasHp ? ['HP'] : []), ...(hasFe ? ['L/100km'] : [])]
    const body = data.chartSummary.map(c => [
      c.name,
      formatCurrency(c.price),
      ...(hasHp ? [String(c.horsepower ?? c.hp ?? '—')] : []),
      ...(hasFe ? [typeof (c.fuelEconomy ?? c.mpg) === 'number' ? (c.fuelEconomy ?? c.mpg)!.toFixed(1) : '—'] : []),
    ])
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      theme: 'striped',
      headStyles: { fillColor: [42, 45, 58], textColor: 255 },
      margin: { left: margin, right: margin },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10
  }

  // Specifications table
  if (y > 220) { doc.addPage(); y = 20 }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Specifications & comparison', margin, y)
  y += 6

  const head = ['Specification', ...data.columnLabels]
  const body = data.specRows.map(r => [
    r.label,
    ...r.values.map((v, i) => fmt(v, r)),
  ])
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: 'striped',
    headStyles: { fillColor: [42, 45, 58], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: 'auto',
  })
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10

  // Recommendations
  const rec = (data.recommendation || '').replace(/\*\*/g, '').trim()
  if (rec) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommendation', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(rec, pageW - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 8
  }

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text('Car Price Predictor', pageW / 2, Math.min(y + 16, 290), { align: 'center' })
  doc.setTextColor(0, 0, 0)

  const name = `car-comparison-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(name)
}
