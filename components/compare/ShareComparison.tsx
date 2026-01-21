'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Copy, Mail, QrCode } from 'lucide-react'
import {
  getCompareShareUrl,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  type CompareShareMode,
  type PredictionCompareState,
} from '@/lib/shareUtils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// WhatsApp icon inline SVG (simple)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface ShareComparisonProps {
  mode: CompareShareMode
  ids?: number[]
  predictionState?: PredictionCompareState | null
  onCopy?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function ShareComparison({
  mode,
  ids,
  predictionState,
  onCopy,
  disabled = false,
  variant = 'outline',
  className = '',
  children,
}: ShareComparisonProps) {
  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const url = getCompareShareUrl({
    mode,
    ids: ids && ids.length > 0 ? ids : undefined,
    predictionState: mode === 'prediction' ? predictionState : undefined,
  })

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
        onCopy?.()
      }
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }, [url, onCopy])

  const handleWhatsApp = () => {
    window.open(getWhatsAppShareUrl(url), '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    const subject = 'Car comparison'
    const body = `Check out this car comparison:\n\n${url}`
    window.location.href = getEmailShareUrl({ subject, body })
  }

  const handleShowQr = useCallback(async () => {
    setQrOpen(true)
    try {
      const QR = (await import('qrcode')).default
      const data = await QR.toDataURL(url, { width: 256, margin: 2 })
      setQrDataUrl(data)
    } catch {
      setQrDataUrl(null)
    }
  }, [url])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} disabled={disabled} className={className}>
            <Share2 className="h-4 w-4 me-2" />
            {children ?? 'Share'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-[#2a2d3a] bg-[#1a1d29]">
          <DropdownMenuItem
            onClick={handleCopy}
            className="text-white focus:bg-[#2a2d3a] focus:text-white"
          >
            <Copy className="h-4 w-4 me-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleWhatsApp}
            className="text-white focus:bg-[#2a2d3a] focus:text-white"
          >
            <WhatsAppIcon className="h-4 w-4 me-2" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEmail}
            className="text-white focus:bg-[#2a2d3a] focus:text-white"
          >
            <Mail className="h-4 w-4 me-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleShowQr}
            className="text-white focus:bg-[#2a2d3a] focus:text-white"
          >
            <QrCode className="h-4 w-4 me-2" />
            QR code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="border-[#2a2d3a] bg-[#1a1d29] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Share via QR code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code" className="w-64 h-64 bg-white rounded-lg p-2" />
            ) : (
              <div className="w-64 h-64 bg-[#2a2d3a] rounded-lg flex items-center justify-center text-[#94a3b8]">
                Loading…
              </div>
            )}
            <Input
              readOnly
              value={url}
              className="bg-[#0f1117] border-[#2a2d3a] text-white text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleCopy} className="border-[#2a2d3a] text-white">
              <Copy className="h-4 w-4 me-2" />
              Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
