"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Edit } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useSellDraft } from '@/context/SellDraftContext'

export default function SellStep5Page() {
  const router = useRouter()
  const locale = useLocale()
  const { listingId } = useSellDraft()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()
  const [showPhoneOnly, setShowPhoneOnly] = useState(true)
  const [preferredMethods, setPreferredMethods] = useState<string[]>([])
  const [editPrefilled, setEditPrefilled] = useState(false)

  const location = (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined')
    ? (() => { try { return JSON.parse(sessionStorage.getItem('sell_location') || '{}') } catch { return {} as Record<string, string> } })()
    : ({} as Record<string, string>)

  useEffect(() => {
    if (!listingId || editPrefilled || typeof sessionStorage === 'undefined') return
    const editId = sessionStorage.getItem('edit_listing_id')
    if (!editId) return
    apiClient.getListing(parseInt(String(listingId), 10)).then((listing) => {
      if (!listing) return
      setValue('phone', listing.phone || '')
      setValue('phone_country_code', listing.phone_country_code || '+964')
      setValue('exact_address', listing.exact_address || '')
      setValue('availability', listing.availability || '')
      setShowPhoneOnly(listing.show_phone_to_buyers_only !== false)
      setPreferredMethods(Array.isArray(listing.preferred_contact_methods) ? listing.preferred_contact_methods : [])
      setEditPrefilled(true)
    }).catch(() => setEditPrefilled(true))
  }, [listingId, editPrefilled, setValue])

  const toggleMethod = (method: string) => {
    setPreferredMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }

  const onSubmit = async (data: any) => {
    const contact = { ...data, show_phone_to_buyers_only: showPhoneOnly, preferred_contact_methods: preferredMethods }
    sessionStorage.setItem('sell_contact', JSON.stringify(contact))
    if (listingId) {
      try {
        await apiClient.updateDraftListing(listingId, {
          phone: contact.phone,
          phone_country_code: contact.phone_country_code || '+1',
          show_phone_to_buyers_only: contact.show_phone_to_buyers_only ?? true,
          preferred_contact_methods: contact.preferred_contact_methods || [],
          availability: contact.availability || null,
          exact_address: contact.exact_address || null,
        })
      } catch {}
    }
    router.push(`/${locale}/sell/step6`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Step 5: Contact Information</CardTitle>
            <CardDescription className="text-gray-400">
              How should buyers contact you?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone */}
              <div>
                <Label className="text-gray-300">Phone Number *</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    {...register('phone_country_code', { required: true })}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    defaultValue="+1"
                  >
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+964">+964 (IQ)</option>
                  </select>
                  <Input
                    {...register('phone', { required: 'Phone number is required' })}
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                  <Checkbox
                    checked={showPhoneOnly}
                    onCheckedChange={(checked) => setShowPhoneOnly(checked as boolean)}
                  />
                  <span className="text-gray-300 text-sm">Show phone to interested buyers only</span>
                </label>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>}
              </div>

              {/* Location */}
              <div>
                <Label className="text-gray-300">Location *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={`${location.city || ''}, ${location.state || ''}, ${location.country || ''}`}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${locale}/sell/step1`)}
                    className="border-gray-600 text-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Exact Address */}
              <div>
                <Label className="text-gray-300">Exact Address (Optional)</Label>
                <Input
                  {...register('exact_address')}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="For map display"
                />
              </div>

              {/* Preferred Contact Methods */}
              <div>
                <Label className="text-gray-300">Preferred Contact Methods</Label>
                <div className="space-y-2 mt-2">
                  {['Phone calls', 'Text/SMS', 'WhatsApp', 'In-app messaging'].map(method => (
                    <label key={method} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={preferredMethods.includes(method)}
                        onCheckedChange={() => toggleMethod(method)}
                      />
                      <span className="text-gray-300 text-sm">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability (Optional) */}
              <div>
                <Label className="text-gray-300">Availability (Optional)</Label>
                <Input
                  {...register('availability')}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Best time to call (e.g., Weekdays after 5 PM)"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/sell/step4`)}
                  className="border-gray-600 text-gray-300"
                >
                  Back
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
