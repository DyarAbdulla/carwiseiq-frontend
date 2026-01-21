"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { LoadingButton } from '@/components/common/LoadingButton'
import { PasswordStrength } from '@/components/common/PasswordStrength'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const locale = useLocale()
  const { toast } = useToast()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setHasSession(!!session)
      setChecking(false)
    }
    run()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: tCommon('error'),
        description: t('passwordMismatch'),
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await supabase.auth.signOut()
      router.replace(`/${locale}/login?password_updated=1`)
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error?.message || t('resetPasswordError'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <div className="text-[#94a3b8]">{tCommon('loading')}</div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <Card className="w-full max-w-md border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl font-bold text-white">
              {t('invalidOrExpiredLink')}
            </CardTitle>
            <CardDescription className="text-[#94a3b8]">
              {t('invalidLinkDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-center text-sm text-[#5B7FFF] hover:underline"
            >
              {t('requestNewResetLink')}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-center text-sm text-[#5B7FFF] hover:underline"
            >
              {t('backToLogin')}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
      <Card className="w-full max-w-md border-[#2a2d3a] bg-[#1a1d29] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">
            {t('resetPassword')}
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">
            {t('resetPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">{t('newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('newPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#94a3b8]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">{t('confirmNewPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmNewPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#94a3b8]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText={t('resetting')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {t('resetPassword')}
            </LoadingButton>
          </form>

          <div className="mt-4 text-center">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-[#5B7FFF] hover:underline"
            >
              {t('backToForgotPassword')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
