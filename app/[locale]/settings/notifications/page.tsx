"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Bell, Mail, Smartphone, Save } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const locale = useLocale()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    email_new_matches: true,
    email_price_drops: true,
    push_notifications: false,
    frequency: 'instant'
  })

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const data = await apiClient.getNotificationSettings()
      if (data) {
        setSettings({
          email_new_matches: data.email_new_matches ?? true,
          email_price_drops: data.email_price_drops ?? true,
          push_notifications: data.push_notifications ?? false,
          frequency: data.frequency || 'instant'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
      return
    }
    loadSettings()
  }, [isAuthenticated, authLoading, loadSettings, router, locale])

  const handleSave = async () => {
    if (!isAuthenticated) return

    setSaving(true)
    try {
      await apiClient.updateNotificationSettings(settings)
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Notification Settings</h1>
          </div>
          <p className="text-gray-400">Manage how and when you receive notifications</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">Email Notifications</CardTitle>
                    <CardDescription className="text-gray-400">
                      Receive email alerts for saved searches and price drops
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">New Matches</Label>
                    <p className="text-sm text-gray-400">
                      Get notified when new cars match your saved searches
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_new_matches}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_new_matches: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Price Drops</Label>
                    <p className="text-sm text-gray-400">
                      Get notified when prices drop on your favorited listings
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_price_drops}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_price_drops: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Email Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, frequency: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant - Get notified immediately</SelectItem>
                      <SelectItem value="daily">Daily Digest - Once per day</SelectItem>
                      <SelectItem value="weekly">Weekly Digest - Once per week</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {settings.frequency === 'instant' && 'You\'ll receive emails as soon as matches are found'}
                    {settings.frequency === 'daily' && 'You\'ll receive a summary email once per day'}
                    {settings.frequency === 'weekly' && 'You\'ll receive a summary email once per week'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-400" />
                  <div>
                    <CardTitle className="text-white">Push Notifications</CardTitle>
                    <CardDescription className="text-gray-400">
                      Browser push notifications (coming soon)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Enable Push Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Receive browser notifications for new matches and price drops
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, push_notifications: checked })
                    }
                    disabled={true}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Push notifications will be available in a future update
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
