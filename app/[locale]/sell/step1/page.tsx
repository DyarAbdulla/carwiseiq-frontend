"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSellDraft } from '@/context/SellDraftContext'

export default function SellStep1Page() {
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const { setLocation, setListingId, setUploadedImages } = useSellDraft()

  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Iraq']
  const states: Record<string, string[]> = {
    'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Kirkuk', 'Diyala', 'Anbar', 'Babylon', 'Wasit', 'Dohuk', 'Maysan', 'Muthanna', 'Qadisiyyah', 'Saladin', 'Dhi Qar'],
  }

  const handleContinue = () => {
    if (!city || !state || !country) {
      toast({
        title: 'Location required',
        description: 'Please select your location',
        variant: 'destructive',
      })
      return
    }

    const loc = { country, state, city }
    sessionStorage.setItem('sell_location', JSON.stringify(loc))
    setLocation(loc)
    setListingId(null)
    setUploadedImages([])

    router.push(`/${locale}/sell/step2`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-2xl text-white">Step 1: Where is your car located?</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Select your location to help buyers find your listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Option 1: Dropdown Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Country</label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    setState('')
                    setCity('')
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {country && states[country] && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">State/Province</label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value)
                      setCity('')
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Select State/Province</option>
                    {states[country].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {state && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}
            </div>

            {/* Option 2: Search Box */}
            <div className="border-t border-gray-700 pt-6">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Or search for location</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by city name..."
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-400">
                  Location autocomplete coming soon
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                disabled={!country || !state || !city}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
