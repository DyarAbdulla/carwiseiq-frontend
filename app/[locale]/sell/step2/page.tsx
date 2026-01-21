"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useSellDraft } from '@/context/SellDraftContext'
import { UploadGrid, UPLOAD_MIN, UPLOAD_MAX } from '@/components/sell/UploadGrid'
import { AiProcessingModal, type AiProcessingStep } from '@/components/sell/AiProcessingModal'
import { apiClient } from '@/lib/api'

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

const MAX_SIZE = 10 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function SellStep2Page() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const {
    listingId,
    setListingId,
    images,
    uploadedImages,
    addImage,
    removeImage,
    removeUploadedImage,
    setUploadedImages,
    setAiDetection,
    setImages,
    location,
    setLocation,
  } = useSellDraft()

  const [draftError, setDraftError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<AiProcessingStep>('analyzing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [detectedMake, setDetectedMake] = useState<string | null>(null)
  const [detectedModel, setDetectedModel] = useState<string | null>(null)
  const createdRef = useRef(false)

  // Rehydrate location from sessionStorage
  useEffect(() => {
    if (!location) {
      try {
        const raw = sessionStorage.getItem('sell_location')
        if (raw) {
          const { country, state, city } = JSON.parse(raw)
          if (country && state && city) setLocation({ country, state, city })
        }
      } catch (_) {}
    }
  }, [location, setLocation])

  // Create draft on mount when we have location and no listingId
  useEffect(() => {
    if (createdRef.current || listingId) return
    const loc = location || (() => {
      try {
        const raw = sessionStorage.getItem('sell_location')
        return raw ? JSON.parse(raw) : null
      } catch (_) {
        return null
      }
    })()
    if (!loc?.country || !loc?.state || !loc?.city) return

    createdRef.current = true
    setDraftError(null)
    apiClient
      .createDraftListing({
        location_country: loc.country,
        location_state: loc.state,
        location_city: loc.city,
      })
      .then((r) => {
        setListingId(r.listing_id)
        sessionStorage.setItem('sell_listing_id', String(r.listing_id))
      })
      .catch((e) => {
        setDraftError(e?.message || 'Failed to create draft')
        createdRef.current = false
      })
  }, [listingId, location, setListingId])

  const handleRemoveUploaded = useCallback(
    (id: number) => {
      if (!listingId) return
      apiClient.deleteListingImage(listingId, id).then(() => removeUploadedImage(id)).catch(() => {
        toast({ title: 'Could not remove image', variant: 'destructive' })
      })
    },
    [listingId, removeUploadedImage, toast]
  )

  const handleAdd = useCallback(
    async (files: File[]) => {
      for (const f of files) {
        if (f.size > MAX_SIZE) {
          toast({ title: 'File too large', description: `${f.name} is over 10MB`, variant: 'destructive' })
          continue
        }
        if (!TYPES.includes(f.type)) {
          toast({ title: 'Invalid type', description: 'Use JPG, PNG or WebP', variant: 'destructive' })
          continue
        }
        if (images.length + uploadedImages.length >= UPLOAD_MAX) {
          toast({ title: 'Maximum 10 images allowed', variant: 'destructive' })
          break
        }
        try {
          const previewUrl = await readAsDataURL(f)
          addImage({ id: crypto.randomUUID(), file: f, previewUrl })
        } catch (_) {
          toast({ title: 'Could not add image', variant: 'destructive' })
        }
      }
    },
    [addImage, images.length, uploadedImages.length, toast]
  )

  const count = uploadedImages.length > 0 ? uploadedImages.length : images.length
  const canNext = count >= UPLOAD_MIN && count <= UPLOAD_MAX
  const hasUploaded = uploadedImages.length > 0

  const runUploadAndVision = useCallback(async () => {
    if (!listingId || images.length < UPLOAD_MIN) return
    const files = images.map((i) => i.file).filter((f): f is File => !!f)
    if (files.length < UPLOAD_MIN) return

    setModalOpen(true)
    setStep('analyzing')
    setErrorMessage(null)
    setDetectedMake(null)
    setDetectedModel(null)

    try {
      // 1) Upload images to listing
      const uploadRes = await apiClient.uploadListingImages(listingId, files)
      const ids = uploadRes.image_ids || []
      const urls = uploadRes.image_urls || []
      const combined = ids.map((id: number, i: number) => ({ id, url: urls[i] || '' })).filter((x: { url: string }) => x.url)
      setUploadedImages(combined)
      setImages([])
      if (typeof window !== 'undefined') sessionStorage.setItem('sell_images', JSON.stringify(combined))

      // 2) Run Claude vision detection
      const vision = await apiClient.detectCarVision(files)
      if (vision.make || vision.model) {
        setDetectedMake(vision.make ?? null)
        setDetectedModel(vision.model ?? null)
        const conf = vision.confidence ?? 0
        const label = conf >= 0.7 ? 'HIGH' : conf >= 0.4 ? 'MEDIUM' : 'LOW'
        setAiDetection({
          make: vision.make ?? undefined,
          model: vision.model ?? undefined,
          confidence: conf,
          confidence_label: label,
          raw: vision,
        })
        setStep('done')
      } else {
        setAiDetection(null)
        setStep('error')
        setErrorMessage(vision.error || "AI couldn't detect car details. Please enter manually.")
      }
    } catch (e: any) {
      setStep('error')
      setErrorMessage(e?.message || 'Upload or AI detection failed. Please try again or continue with manual entry.')
    }
  }, [listingId, images, setUploadedImages, setAiDetection, setImages])

  const handleNext = () => {
    if (count < UPLOAD_MIN) {
      toast({ title: 'Please upload at least 4 images for AI detection', variant: 'destructive' })
      return
    }
    if (count > UPLOAD_MAX) {
      toast({ title: 'Maximum 10 images allowed', variant: 'destructive' })
      return
    }
    if (!listingId) {
      toast({ title: 'Please wait', description: draftError || 'Preparing...', variant: 'destructive' })
      return
    }
    if (hasUploaded) {
      router.push(`/${locale}/sell/step4`)
      return
    }
    runUploadAndVision()
  }

  const handleModalContinue = () => {
    setModalOpen(false)
    router.push(`/${locale}/sell/step4`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Upload photos</CardTitle>
            <CardDescription className="text-gray-400">
              Add 4–10 photos of your car for AI detection. JPG, PNG or WebP. Max 10MB each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {draftError && (
              <p className="text-amber-400 text-sm">Draft error: {draftError}. You can retry by refreshing.</p>
            )}
            <UploadGrid
              images={images}
              uploadedImages={uploadedImages}
              onAdd={handleAdd}
              onRemove={removeImage}
              onRemoveUploaded={handleRemoveUploaded}
              imageBase={typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') : ''}
            />
            <p className="text-gray-400 text-sm">
              {canNext ? (
                <span className="text-emerald-400">✓ {count} photo{count !== 1 ? 's' : ''} (4–10 for AI detection)</span>
              ) : (
                <span>Add 4–10 photos to continue. AI will detect make and model after you click Next.</span>
              )}
            </p>
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/sell/step1`)}
                className="border-gray-600 text-gray-300"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canNext || !listingId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <AiProcessingModal
        open={modalOpen}
        step={step}
        detectedMake={detectedMake}
        detectedModel={detectedModel}
        errorMessage={errorMessage ?? undefined}
        onContinue={handleModalContinue}
      />
    </div>
  )
}
