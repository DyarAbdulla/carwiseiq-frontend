"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale() || 'en'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login: authLogin, signInWithGoogle } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const passwordUpdatedShown = useRef(false)

  const returnUrl = searchParams?.get('returnUrl') || `/${locale}`

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (searchParams?.get('password_updated') === '1' && !passwordUpdatedShown.current) {
      passwordUpdatedShown.current = true
      toast({ title: 'Password updated', description: 'You can sign in with your new password.' })
      router.replace(`/${locale}/login`)
    }
  }, [mounted, searchParams, toast, router, locale])

  const onSubmit = async (data: LoginForm) => {
    try {
      await authLogin(data.email, data.password, data.rememberMe)

      toast({
        title: tCommon('success'),
        description: t('loginSuccess') || 'Login successful',
      })

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Redirect to return URL or home
      if (typeof window !== 'undefined') {
        window.location.href = returnUrl
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const msg = (error?.message || '') as string

      // Handle specific error cases
      let errorMessage = msg || t('loginError') || 'Login failed. Please check your credentials.'

      // Supabase: email not confirmed (must verify before login)
      if (/email not confirmed/i.test(msg)) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for the verification link.'
        toast({
          title: tCommon('error'),
          description: errorMessage,
          variant: 'destructive',
        })
        router.push(`/${locale}/verify-email?email=${encodeURIComponent((document.getElementById('email') as HTMLInputElement)?.value || '')}`)
        return
      }

      // Rate limiting
      if (/too many|rate limit/i.test(msg)) {
        errorMessage = 'Too many login attempts. Please wait 15 minutes before trying again.'
      }

      // Account lockout
      if (/locked/i.test(msg)) {
        const lockMatch = msg.match(/after (.+?) UTC/)
        errorMessage = lockMatch ? `Account is locked. Try again after ${lockMatch[1]} UTC.` : 'Account is temporarily locked. Please try again in 30 minutes.'
      }

      // Incorrect email or password / Invalid login credentials (Supabase) – suggest verify email if just registered
      if (/incorrect email or password|invalid login credentials/i.test(msg)) {
        errorMessage = "Invalid email or password. If you just registered, verify your email first, then try again. Otherwise use Forgot password."
      }

      toast({
        title: tCommon('error'),
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  const getTranslation = (key: string, fallback: string) => {
    try {
      return t(key as any) || fallback
    } catch {
      return fallback
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
        <Card className="w-full max-w-md border-[#2a2d3a] bg-[#1a1d29] text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              {getTranslation('login', 'Login')}
            </CardTitle>
            <CardDescription className="text-[#94a3b8]">
              {getTranslation('loginDescription', 'Sign in to your account')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  {getTranslation('email', 'Email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8] rtl:left-auto rtl:right-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={getTranslation('emailPlaceholder', 'Enter your email')}
                    className={`ps-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
                      }`}
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-y-1">
                  <Label htmlFor="password" className="text-white min-w-0">
                    {getTranslation('password', 'Password')}
                  </Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-sm text-[#5B7FFF] hover:underline text-end break-words ms-auto"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8] rtl:left-auto rtl:right-3" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={getTranslation('passwordPlaceholder', 'Enter your password')}
                    className={`ps-10 pe-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
                      }`}
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#94a3b8] hover:text-white transition-colors rtl:right-auto rtl:left-3"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={watch('rememberMe') === true}
                  onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
                  disabled={isSubmitting}
                  className="border-[#2a2d3a]"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-[#94a3b8] cursor-pointer"
                >
                  {t('rememberMe')}
                </Label>
              </div>

              <LoadingButton
                type="submit"
                loading={isSubmitting}
                loadingText={getTranslation('loggingIn', 'Logging in...')}
                className="w-full bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {getTranslation('login', 'Login')}
              </LoadingButton>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#2a2d3a]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1d29] px-2 text-[#94a3b8]">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-[#2a2d3a] bg-[#0f1117] text-white hover:bg-[#2a2d3a]"
                disabled={googleLoading || isSubmitting}
                onClick={async () => {
                  setGoogleLoading(true)
                  try {
                    await signInWithGoogle(locale)
                  } catch (e: any) {
                    setGoogleLoading(false)
                    toast({
                      title: tCommon('error'),
                      description: e?.message || 'Google sign-in failed',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#94a3b8] border-t-transparent" />
                    Redirecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <GoogleIcon className="h-5 w-5" />
                    Google
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-[#94a3b8] break-words">
              {getTranslation('noAccount', "Don't have an account?")}{' '}
              <Link
                href={`/${locale}/register`}
                className="text-[#5B7FFF] hover:underline font-medium break-words"
              >
                {getTranslation('register', 'Register')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
