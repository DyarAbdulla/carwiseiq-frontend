"use client"


export const runtime = 'edge';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { apiClient } from '@/lib/api'
import { PasswordStrength } from '@/components/common/PasswordStrength'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must not exceed 72 characters')
      .refine(
        (pwd) => {
          const encoder = new TextEncoder()
          return encoder.encode(pwd).length <= 72
        },
        'Password is too long (maximum 72 bytes)'
      )
      .refine(
        (pwd) => /[A-Z]/.test(pwd),
        'Password must contain at least one uppercase letter'
      )
      .refine(
        (pwd) => /[0-9]/.test(pwd),
        'Password must contain at least one number'
      )
      .refine(
        (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    terms_accepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale() || 'en'
  const router = useRouter()
  const { toast } = useToast()
  const { register: authRegister } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Use enhanced register API
      const response = await apiClient.register(
        data.email,
        data.password,
        data.confirmPassword,
        data.full_name,
        data.terms_accepted
      )

      toast({
        title: tCommon('success'),
        description: 'Account created! Please check your email to verify your account.',
      })

      // Redirect to email verification page
      router.push(`/${locale}/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      let errorMessage = error.message || t('registerError') || 'Registration failed'
      
      // Handle rate limiting
      if (error.message?.includes('Too many') || error.message?.includes('rate limit')) {
        errorMessage = 'Too many registration attempts from this IP. Please try again tomorrow.'
      }
      
      toast({
        title: tCommon('error'),
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const getTranslation = (key: string, fallback: string) => {
    try {
      return t(key as any) || fallback
    } catch {
      return fallback
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6 bg-[#0f1117]">
      <Card className="w-full max-w-md border-[#2a2d3a] bg-[#1a1d29] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">
            {getTranslation('register', 'Register')}
          </CardTitle>
          <CardDescription className="text-[#94a3b8]">
            {getTranslation('registerDescription', 'Create a new account to save cars and comparisons')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-white">
                Full Name (Optional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  className={`pl-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${
                    errors.full_name ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
                  }`}
                  {...register('full_name')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-400">{errors.full_name.message}</p>
              )}
            </div>

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
                  className={`pl-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
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
              <Label htmlFor="password" className="text-white">
                {getTranslation('password', 'Password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={getTranslation('passwordPlaceholder', 'Enter your password')}
                  className={`pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${
                    errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
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
              {password && (
                <PasswordStrength password={password} className="mt-2" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                {getTranslation('confirmPassword', 'Confirm Password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={getTranslation('confirmPasswordPlaceholder', 'Confirm your password')}
                  className={`pl-10 pr-10 border-[#2a2d3a] bg-[#0f1117] text-white placeholder:text-[#94a3b8] ${
                    errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-[#5B7FFF]'
                  }`}
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#94a3b8] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={watch('terms_accepted')}
                onCheckedChange={(checked) => setValue('terms_accepted', !!checked)}
                disabled={isSubmitting}
                className="border-[#2a2d3a] mt-1"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-[#94a3b8] cursor-pointer leading-relaxed"
              >
                I accept the{' '}
                <Link
                  href={`/${locale}/terms`}
                  className="text-[#5B7FFF] hover:underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  href={`/${locale}/privacy`}
                  className="text-[#5B7FFF] hover:underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.terms_accepted && (
              <p className="text-sm text-red-400">{errors.terms_accepted.message}</p>
            )}

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText={getTranslation('registering', 'Creating account...')}
              className="w-full bg-[#5B7FFF] hover:bg-[#5B7FFF]/90 text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {getTranslation('register', 'Register')}
            </LoadingButton>
          </form>

          <div className="mt-4 text-center text-sm text-[#94a3b8]">
            {getTranslation('hasAccount', 'Already have an account?')}{' '}
            <Link
              href={`/${locale}/login`}
              className="text-[#5B7FFF] hover:underline font-medium"
            >
              {getTranslation('login', 'Login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
