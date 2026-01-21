"use client"

import { useState, useEffect } from 'react'
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
  const { login: authLogin } = useAuth()

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
      
      // Handle specific error cases
      let errorMessage = error.message || t('loginError') || 'Login failed. Please check your credentials.'
      
      // Check for rate limiting
      if (error.message?.includes('Too many') || error.message?.includes('rate limit')) {
        errorMessage = 'Too many login attempts. Please wait 15 minutes before trying again.'
      }
      
      // Check for account lockout
      if (error.message?.includes('locked') || error.message?.includes('Locked')) {
        const lockMatch = error.message.match(/after (.+?) UTC/)
        if (lockMatch) {
          errorMessage = `Account is locked. Try again after ${lockMatch[1]} UTC.`
        } else {
          errorMessage = 'Account is temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.'
        }
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
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={getTranslation('emailPlaceholder', 'Enter your email')}
                    className={`pl-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">
                    {getTranslation('password', 'Password')}
                  </Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-sm text-[#5B7FFF] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={getTranslation('passwordPlaceholder', 'Enter your password')}
                    className={`pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
                      }`}
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#94a3b8] hover:text-white transition-colors"
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={watch('rememberMe')}
                  onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
                  disabled={isSubmitting}
                  className="border-[#2a2d3a]"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-[#94a3b8] cursor-pointer"
                >
                  Remember me
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
            </form>

            <div className="mt-4 text-center text-sm text-[#94a3b8]">
              {getTranslation('noAccount', "Don't have an account?")}{' '}
              <Link
                href={`/${locale}/register`}
                className="text-[#5B7FFF] hover:underline font-medium"
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
