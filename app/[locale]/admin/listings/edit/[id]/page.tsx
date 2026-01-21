"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Save } from "lucide-react"

const CONDITIONS = ["Excellent", "Very Good", "Good", "Fair", "Poor"]
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Other"]
const FUEL_TYPES = ["Gasoline", "Diesel", "Electric", "Hybrid", "Other"]
const STATUS_OPTIONS = ["active", "draft", "sold", "deleted"]

export default function AdminListingEditPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const id = params?.id as string

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>({})

  const load = useCallback(async () => {
    const n = parseInt(id, 10)
    if (isNaN(n)) {
      toast({ title: "Error", description: "Invalid listing ID", variant: "destructive" })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await apiClient.getListing(n)
      setListing(data)
      setForm({
        make: data.make ?? "",
        model: data.model ?? "",
        year: data.year ?? "",
        trim: data.trim ?? "",
        price: data.price ?? "",
        mileage: data.mileage ?? "",
        mileage_unit: data.mileage_unit ?? "km",
        condition: data.condition ?? "",
        transmission: data.transmission ?? "",
        fuel_type: data.fuel_type ?? "",
        color: data.color ?? "",
        description: data.description ?? "",
        status: data.status ?? "active",
      })
    } catch (e) {
      console.error("[Admin Edit] load error:", e)
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load listing",
        variant: "destructive",
      })
      setListing(null)
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleChange = (key: string, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    const n = parseInt(id, 10)
    if (isNaN(n)) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        make: String(form.make || "").trim() || undefined,
        model: String(form.model || "").trim() || undefined,
        year: form.year ? parseInt(String(form.year), 10) : undefined,
        trim: String(form.trim || "").trim() || undefined,
        price: form.price != null && form.price !== "" ? parseFloat(String(form.price)) : undefined,
        mileage: form.mileage != null && form.mileage !== "" ? parseFloat(String(form.mileage)) : undefined,
        mileage_unit: form.mileage_unit || "km",
        condition: form.condition || undefined,
        transmission: form.transmission || undefined,
        fuel_type: form.fuel_type || undefined,
        color: form.color || undefined,
        description: String(form.description || "").trim() || undefined,
        status: form.status || undefined,
      }
      const cleaned: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && v !== "") cleaned[k] = v
      }
      await apiClient.adminPatchListing(n, cleaned)
      toast({ title: "Saved", description: "Listing updated." })
      router.push(`/${locale}/admin/listings`)
    } catch (e) {
      console.error("[Admin Edit] save error:", e)
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  if (!listing) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/admin/listings`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </Link>
        <p className="text-gray-400">Listing not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/${locale}/admin/listings`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Listings
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Listing #{id}</h1>
          <p className="text-gray-400 mt-1">
            {listing.year} {listing.make} {listing.model}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Details</CardTitle>
          <CardDescription className="text-gray-400">Update listing fields. Admin can edit any status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Make</Label>
              <Input
                value={form.make ?? ""}
                onChange={(e) => handleChange("make", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Model</Label>
              <Input
                value={form.model ?? ""}
                onChange={(e) => handleChange("model", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Year</Label>
              <Input
                type="number"
                value={form.year ?? ""}
                onChange={(e) => handleChange("year", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Trim</Label>
              <Input
                value={form.trim ?? ""}
                onChange={(e) => handleChange("trim", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Price</Label>
              <Input
                type="number"
                value={form.price ?? ""}
                onChange={(e) => handleChange("price", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Mileage</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={form.mileage ?? ""}
                  onChange={(e) => handleChange("mileage", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Select value={String(form.mileage_unit || "km")} onValueChange={(v) => handleChange("mileage_unit", v)}>
                  <SelectTrigger className="w-[100px] bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km" className="text-white">km</SelectItem>
                    <SelectItem value="miles" className="text-white">miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Condition</Label>
              <Select value={String(form.condition || "")} onValueChange={(v) => handleChange("condition", v)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Transmission</Label>
              <Select value={String(form.transmission || "")} onValueChange={(v) => handleChange("transmission", v)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSMISSIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Fuel Type</Label>
              <Select value={String(form.fuel_type || "")} onValueChange={(v) => handleChange("fuel_type", v)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f} className="text-white">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Color</Label>
              <Input
                value={form.color ?? ""}
                onChange={(e) => handleChange("color", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300">Status (admin only)</Label>
              <Select value={String(form.status || "active")} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
