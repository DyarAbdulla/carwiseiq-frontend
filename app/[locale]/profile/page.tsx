"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Mail, Phone, MapPin, Camera, Lock, Download, Trash2, Eye, EyeOff } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { LoadingButton } from '@/components/common/LoadingButton'
import { PasswordStrength } from '@/components/common/PasswordStrength'

export default function ProfilePage() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const { user, loading: authLoading, checkAuth } = useAuth()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    email_verified: false
  })

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({ full_name: '', phone: '', location: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push(`/${locale}/login`)
      return
    }
    loadProfile()
  }, [user, authLoading])

  const loadProfile = async () => {
    if (!user) {
      router.push(`/${locale}/login`)
      return
    }

    try {
      const userData = await apiClient.getMe()
      setProfile({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: '',
        location: '',
        email_verified: userData.email_verified || false
      })
      setProfileData({
        full_name: userData.full_name || '',
        phone: '',
        location: ''
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await apiClient.updateProfile(profileData)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully'
      })
      setEditingProfile(false)
      await loadProfile()
      await checkAuth()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      })
      return
    }

    setSavingProfile(true)
    try {
      await apiClient.changePassword(
        passwordData.current,
        passwordData.new,
        passwordData.confirm
      )
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully'
      })
      setChangingPassword(false)
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleExportData = async () => {
    try {
      const data = await apiClient.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export data',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm',
        variant: 'destructive'
      })
      return
    }

    setDeleting(true)
    try {
      await apiClient.deleteAccount()
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully'
      })
      router.push(`/${locale}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }
  if (!user) {
    return null
  }
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] p-6 bg-[#0f1117]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-[#94a3b8]">Manage your account settings and preferences</p>
        </div>

        {/* Email Verification Banner */}
        {!profile.email_verified && (
          <Card className="border-yellow-500 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-medium">Please verify your email</p>
                  <p className="text-yellow-300/80 text-sm mt-1">
                    Verify your email to post listings and access all features
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/${locale}/verify-email?email=${encodeURIComponent(profile.email)}`)}
                  variant="outline"
                  className="border-yellow-500 text-yellow-400"
                >
                  Verify Email
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editingProfile ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#94a3b8]">Full Name</Label>
                    <p className="text-white mt-1">{profile.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-[#94a3b8]">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white">{profile.email}</p>
                      {profile.email_verified ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Verified</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Unverified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#94a3b8]">Phone</Label>
                    <p className="text-white mt-1">{profile.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-[#94a3b8]">Location</Label>
                    <p className="text-white mt-1">{profile.location || 'Not set'}</p>
                  </div>
                </div>
                <Button onClick={() => setEditingProfile(true)} className="mt-4">
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-white">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="mt-1 border-[#2a2d3a] bg-[#0f1117] text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="mt-1 border-[#2a2d3a] bg-[#0f1117] text-white"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-white">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="mt-1 border-[#2a2d3a] bg-[#0f1117] text-white"
                      placeholder="Enter your location"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <LoadingButton
                    onClick={handleSaveProfile}
                    loading={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </LoadingButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false)
                      setProfileData({ full_name: profile.full_name || '', phone: profile.phone || '', location: profile.location || '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!changingPassword ? (
              <Button onClick={() => setChangingPassword(true)} variant="outline">
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current_password" className="text-white">Current Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                    <Input
                      id="current_password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3 text-[#94a3b8]"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new_password" className="text-white">New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                    <Input
                      id="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3 text-[#94a3b8]"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.new && <PasswordStrength password={passwordData.new} className="mt-2" />}
                </div>
                <div>
                  <Label htmlFor="confirm_password" className="text-white">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3 text-[#94a3b8]"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <LoadingButton
                    onClick={handleChangePassword}
                    loading={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Update Password
                  </LoadingButton>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false)
                      setPasswordData({ current: '', new: '', confirm: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Export & Deletion */}
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Export your data or delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-white font-medium mb-2">Export Your Data</h3>
              <p className="text-[#94a3b8] text-sm mb-4">
                Download all your data in JSON format (GDPR compliant)
              </p>
              <Button onClick={handleExportData} variant="outline" className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
            </div>
            <div className="border-t border-[#2a2d3a] pt-4">
              <h3 className="text-red-400 font-medium mb-2">Delete Account</h3>
              <p className="text-[#94a3b8] text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="destructive"
                className="w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1d29] border-[#2a2d3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Account</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm:
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="mt-1 border-[#2a2d3a] bg-[#0f1117] text-white"
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirm('')
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleDeleteAccount}
              loading={deleting}
              variant="destructive"
              disabled={deleteConfirm !== 'DELETE'}
            >
              Delete Account
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
