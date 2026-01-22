"use client"


export const runtime = 'edge';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useSellDraft } from '@/context/SellDraftContext'
import { listingImageUrl } from '@/lib/utils'
import { CheckCircle2, Edit } from 'lucide-react'

export default function SellStep6Page() {
  const [listingData, setListingData] = useState<any>(null)
  const [agreed, setAgreed] = useState({ terms: false, accurate: false, training: false })
  const [publishing, setPublishing] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const { listingId, uploadedImages, carDetails: ctxCar, location: ctxLoc, clearDraft } = useSellDraft()

  useEffect(() => {
    const location = ctxLoc || (() => { try { return JSON.parse(sessionStorage.getItem('sell_location') || '{}') } catch { return {} } })()
    const images = (uploadedImages && uploadedImages.length > 0)
      ? uploadedImages
      : (() => { try { return JSON.parse(sessionStorage.getItem('sell_images') || '[]') } catch { return [] } })()
    const carDetails = ctxCar || (() => { try { return JSON.parse(sessionStorage.getItem('sell_car_details') || '{}') } catch { return {} } })()
    const contact = (() => { try { return JSON.parse(sessionStorage.getItem('sell_contact') || '{}') } catch { return {} } })()

    setListingData({ location, images, carDetails, contact })
  }, [uploadedImages, ctxCar, ctxLoc])

  const handlePublish = async () => {
    if (!agreed.terms || !agreed.accurate) {
      toast({ title: 'Agreement required', description: 'Please agree to all required terms', variant: 'destructive' })
      return
    }
    if (!listingId) {
      toast({ title: 'Missing draft', description: 'Please go back to Step 2 to upload photos and create the listing', variant: 'destructive' })
      router.push(`/${locale}/sell/step2`)
      return
    }
    if (!listingData?.carDetails?.make || !listingData?.carDetails?.model || !listingData?.carDetails?.year) {
      toast({ title: 'Missing information', description: 'Please complete all required car details', variant: 'destructive' })
      router.push(`/${locale}/sell/step4`)
      return
    }
    if (!listingData?.location?.city || !listingData?.location?.state || !listingData?.location?.country) {
      toast({ title: 'Missing location', description: 'Please select your location', variant: 'destructive' })
      router.push(`/${locale}/sell/step1`)
      return
    }
    if (!listingData?.contact?.phone) {
      toast({ title: 'Missing contact info', description: 'Please provide your phone number', variant: 'destructive' })
      router.push(`/${locale}/sell/step5`)
      return
    }

    setPublishing(true)
    try {
      await apiClient.publishListing(listingId)
      toast({ title: 'Success!', description: 'Your car listing has been published' })
      sessionStorage.removeItem('sell_location')
      sessionStorage.removeItem('sell_images')
      sessionStorage.removeItem('sell_listing_id')
      sessionStorage.removeItem('sell_ai_detected')
      sessionStorage.removeItem('sell_car_details')
      sessionStorage.removeItem('sell_contact')
      clearDraft()
      router.push(`/${locale}/sell/success?id=${listingId}`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to publish listing', variant: 'destructive' })
    } finally {
      setPublishing(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!listingId) {
      toast({ title: 'Missing draft', description: 'Please complete Step 2 first', variant: 'destructive' })
      router.push(`/${locale}/sell/step2`)
      return
    }
    try {
      const cd = listingData?.carDetails || {}
      const co = listingData?.contact || {}
      const loc = listingData?.location || {}
      await apiClient.updateDraftListing(listingId, {
        make: cd.make || null, model: cd.model || null, year: cd.year ? parseInt(cd.year) : null, trim: cd.trim || null,
        price: cd.price != null ? parseFloat(cd.price) : null, mileage: cd.mileage != null ? parseFloat(cd.mileage) : null,
        mileage_unit: cd.mileage_unit || 'km', condition: cd.condition || null, transmission: cd.transmission || null,
        fuel_type: cd.fuel_type || null, color: cd.color || null, features: cd.features || [],
        description: cd.description || null, vin: cd.vin || null,
        location_country: loc.country || null, location_state: loc.state || null, location_city: loc.city || null,
        phone: co.phone || null, phone_country_code: co.phone_country_code || '+1',
        show_phone_to_buyers_only: co.show_phone_to_buyers_only ?? true,
        preferred_contact_methods: co.preferred_contact_methods || [], availability: co.availability || null,
        exact_address: co.exact_address || null,
      })
      toast({ title: 'Draft saved', description: 'Your listing has been saved as draft' })
      sessionStorage.removeItem('sell_location')
      sessionStorage.removeItem('sell_images')
      sessionStorage.removeItem('sell_listing_id')
      sessionStorage.removeItem('sell_car_details')
      sessionStorage.removeItem('sell_contact')
      clearDraft()
      router.push(`/${locale}/buy-sell`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save draft', variant: 'destructive' })
    }
  }

  if (!listingData) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Step 6: Review your listing</CardTitle>
            <CardDescription className="text-gray-400">
              Review all details before publishing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Images Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Photos</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${locale}/sell/step2`)}
                  className="border-gray-600 text-gray-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              {listingData.images && listingData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {listingData.images.slice(0, 6).map((img: any, idx: number) => (
                    <div key={img.id ?? idx} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={img.url ? listingImageUrl(img.url) : img.preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No images uploaded</div>
              )}
            </div>

            {/* Car Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Car Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${locale}/sell/step4`)}
                  className="border-gray-600 text-gray-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                <p className="text-white text-xl font-bold">
                  {listingData.carDetails?.year || 'N/A'} {listingData.carDetails?.make || ''} {listingData.carDetails?.model || ''}
                </p>
                <p className="text-white text-2xl font-bold">
                  ${listingData.carDetails?.price ? listingData.carDetails.price.toLocaleString() : '0'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-gray-300 text-sm">
                  <p>Mileage: {listingData.carDetails?.mileage?.toLocaleString() || '0'} {listingData.carDetails?.mileage_unit || 'km'}</p>
                  <p>Condition: {listingData.carDetails?.condition || 'N/A'}</p>
                  <p>Transmission: {listingData.carDetails?.transmission || 'N/A'}</p>
                  <p>Fuel: {listingData.carDetails?.fuel_type || 'N/A'}</p>
                </div>
                {listingData.carDetails?.description && (
                  <p className="text-gray-300 mt-4">{listingData.carDetails.description}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Contact Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${locale}/sell/step5`)}
                  className="border-gray-600 text-gray-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-gray-300">
                <p>Phone: {listingData.contact?.phone_country_code || '+1'} {listingData.contact?.phone || 'N/A'}</p>
                <p>Location: {listingData.location?.city || 'N/A'}, {listingData.location?.state || 'N/A'}, {listingData.location?.country || 'N/A'}</p>
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3 border-t border-gray-700 pt-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <Checkbox
                  checked={agreed.terms}
                  onCheckedChange={(checked) => setAgreed({ ...agreed, terms: checked as boolean })}
                />
                <span className="text-gray-300 text-sm">I agree to Terms of Service *</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <Checkbox
                  checked={agreed.accurate}
                  onCheckedChange={(checked) => setAgreed({ ...agreed, accurate: checked as boolean })}
                />
                <span className="text-gray-300 text-sm">I confirm this information is accurate *</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer">
                <Checkbox
                  checked={agreed.training}
                  onCheckedChange={(checked) => setAgreed({ ...agreed, training: checked as boolean })}
                />
                <span className="text-gray-300 text-sm">I allow this data to be used for AI training (anonymized)</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
              >
                Save as Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!agreed.terms || !agreed.accurate || publishing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {publishing ? 'Publishing...' : 'Publish Listing'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
