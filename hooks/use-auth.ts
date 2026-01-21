"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setUser(null)
      setLoading(false)
      return
    }
    if (typeof pathname === 'string' && pathname.includes('/admin/')) {
      setLoading(false)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email ?? '' })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [pathname])

  useEffect(() => {
    checkAuth()
  }, [pathname])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onFocus = () => checkAuth()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [checkAuth])

  const login = async (email: string, password: string, _rememberMe?: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email ?? '' })
    }
    return {
      token: data.session?.access_token,
      user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null,
    }
  }

  const signInWithGoogle = async (locale: string = 'en') => {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/${locale}/auth/callback` : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  const register = async (
    email: string,
    password: string,
    _confirmPassword: string,
    fullName?: string,
    _termsAccepted?: boolean,
    locale: string = 'en'
  ) => {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/${locale}/auth/callback` : undefined
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) throw error
    const u = data.user
    return {
      token: data.session?.access_token ?? null,
      user: u ? { id: u.id, email: u.email ?? '' } : null,
    }
  }

  const forgotPassword = async (email: string, locale: string = 'en') => {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/${locale}/auth/callback` : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const verify = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email ?? '' })
      return true
    }
    return false
  }

  return {
    user,
    loading,
    login,
    signInWithGoogle,
    register,
    forgotPassword,
    logout,
    checkAuth,
    verify,
    isAuthenticated: !!user,
  }
}
