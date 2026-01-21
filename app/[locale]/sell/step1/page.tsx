"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSellDraft } from '@/context/SellDraftContext'
import { apiClient } from '@/lib/api'

export default function SellStep1Page() {
  const [country] = useState('Iraq')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editLoaded, setEditLoaded] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { setLocation, setListingId, setUploadedImages } = useSellDraft()
  const t = useTranslations('sell')
  const editId = searchParams?.get('edit') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edit_listing_id') : null)

  const states: Record<string, string[]> = {
    'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Kirkuk', 'Diyala', 'Anbar', 'Babylon', 'Wasit', 'Dohuk', 'Maysan', 'Muthanna', 'Qadisiyyah', 'Saladin', 'Dhi Qar'],
  }
  const citiesByState: Record<string, string[]> = {
    'Baghdad': ['Baghdad', 'Mahmudiya', 'Abu Ghraib', 'Tarmiya'],
    'Basra': ['Basra', 'Zubayr', 'Abu al-Khaseeb', 'Al-Qurna', 'Al-Faw'],
    'Mosul': ['Mosul', 'Tal Afar', 'Sinjar', 'Tel Keppe', 'Al-Hamdaniya'],
    'Erbil': ['Erbil', 'Soran', 'Rawanduz', 'Koisanjaq', 'Mergasur', 'Choman', 'Shaqlawa'],
    'Najaf': ['Najaf', 'Kufa', 'Al-Manathera', 'Al Mishkhab'],
    'Karbala': ['Karbala', 'Ain al-Tamur', 'Al-Hindiya'],
    'Sulaymaniyah': ['Sulaymaniyah', 'Halabja', 'Ranya', 'Darbandikhan', 'Kalar', 'Chamchamal', 'Bakrajo', 'Qader Karam', 'Penjwen', 'Mawat'],
    'Kirkuk': ['Kirkuk', 'Hawija', 'Daquq', 'Al-Hawija'],
    'Diyala': ['Baqubah', 'Khanaqin', 'Muqdadiyah', 'Baladruz', 'Khalis'],
    'Anbar': ['Ramadi', 'Fallujah', 'Hit', 'Haditha', 'Qaim', 'Rutba'],
    'Babylon': ['Hillah', 'Al-Musayib', 'Al-Qasim', 'Al-Mahawil'],
    'Wasit': ['Kut', 'Al-Hai', 'Al-Numaniya', 'Al-Aziziya'],
    'Dohuk': ['Dohuk', 'Zakho', 'Amedi', 'Aqra', 'Sumail'],
    'Maysan': ['Amarah', 'Ali al-Gharbi', 'Al-Kahla', 'Al-Maimouna'],
    'Muthanna': ['Samawa', 'Al-Rumaitha', 'Al-Salman'],
    'Qadisiyyah': ['Diwaniyah', 'Al-Shamiya', 'Al-Daghara', 'Al-Hamza'],
    'Saladin': ['Tikrit', 'Samarra', 'Balad', 'Baiji', 'Tuz Khurmatu', 'Dujail', 'Al-Daur'],
    'Dhi Qar': ['Nasiriyah', 'Suq al-Shuyukh', 'Al-Chibayish', 'Al-Rifai'],
  }
  const cityOptions = (state && citiesByState[state]) ? citiesByState[state] : (state ? [state] : [])

  useEffect(() => {
    if (!editId || editLoaded) return
    const id = typeof editId === 'string' ? parseInt(editId, 10) : editId
    if (isNaN(id)) return
    apiClient.getListing(id).then((listing) => {
      if (!listing) return
      setState(listing.location_state || '')
      setCity(listing.location_city || '')
      const loc = { country: listing.location_country || 'Iraq', state: listing.location_state || '', city: listing.location_city || '' }
      setLocation(loc)
      setListingId(listing.id)
      setUploadedImages((listing.images || []).map((img: { id?: number; url?: string }) => ({ id: img.id ?? 0, url: img.url || '' })))
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('edit_listing_id', String(listing.id))
        sessionStorage.setItem('sell_listing_id', String(listing.id))
        sessionStorage.setItem('sell_location', JSON.stringify(loc))
      }
      setEditLoaded(true)
    }).catch(() => setEditLoaded(true))
  }, [editId, editLoaded, setLocation, setListingId, setUploadedImages])

  const handleContinue = () => {
    if (!city || !state || !country) {
      toast({
        title: t('locationRequired'),
        description: t('selectLocation'),
        variant: 'destructive',
      })
      return
    }

    const loc = { country, state, city }
    sessionStorage.setItem('sell_location', JSON.stringify(loc))
    setLocation(loc)
    if (!editId) {
      setListingId(null)
      setUploadedImages([])
    }

    router.push(`/${locale}/sell/step2`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-2xl text-white">{t('step1Title')}</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              {t('step1Description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location: Iraq only — State (Governorate) and City */}
            <div className="space-y-4">
              {country && states[country] && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">{t('stateProvince')}</label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value)
                      setCity('')
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">{t('selectStateProvince')}</option>
                    {states[country].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {state && cityOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">{t('city')}</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">{t('selectCity')}</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Option 2: Search Box */}
            <div className="border-t border-gray-700 pt-6">
              <label className="text-sm font-medium text-gray-300 mb-2 block">{t('orSearchLocation')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-400">
                  {t('autocompleteComingSoon')}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                disabled={!country || !state || !city}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('continue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
