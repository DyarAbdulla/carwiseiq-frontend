"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { apiClient, getToken, removeToken } from '@/lib/api'

interface User {
  id: number
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        setUser(null)
        setLoading(false)
        return
      }

      const token = getToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const userData = await apiClient.getMe()
        // Validate userData structure
        if (userData && typeof userData === 'object' && userData.email) {
          setUser(userData)
        } else {
          throw new Error('Invalid user data received')
        }
      } catch (apiError: any) {
        // Not authenticated or token expired
        console.error('Auth check failed:', apiError?.message || apiError)
        // Only remove token if it's an auth error (401, 403), not network errors
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          removeToken()
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // Not authenticated or token expired
      if (typeof window !== 'undefined') {
        const token = getToken()
        // Only remove if token exists but verification failed
        if (token) {
          removeToken()
        }
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check auth on mount and when pathname changes
  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only re-check when route changes, checkAuth is stable

  // Also check auth on window focus (user might have logged in another tab)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleFocus = () => {
      checkAuth()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [checkAuth])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      const response = await apiClient.login(email, password, rememberMe || false)
      if (response && response.user && typeof response.user === 'object') {
        setUser(response.user)
        // apiClient.login already called setToken(access_token); no extra /auth/me here
      }
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (
    email: string,
    password: string,
    confirmPassword: string,
    fullName?: string,
    termsAccepted: boolean = false
  ) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      const response = await apiClient.register(email, password, confirmPassword, fullName, termsAccepted)
      if (response && response.user && typeof response.user === 'object') {
        setUser(response.user)
        // apiClient.register already called setToken(access_token); no extra /auth/me here
      }
      return response
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }

  const verify = async () => {
    try {
      if (typeof window === 'undefined') {
        return false
      }
      const response = await apiClient.verifyToken()
      if (response && response.valid && response.user && typeof response.user === 'object') {
        setUser(response.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Verify error:', error)
      setUser(null)
      return false
    }
  }

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        await apiClient.logout()
      }
      // Clear user state immediately
      setUser(null)
      // Refresh auth state to ensure everything is cleared
      await checkAuth()
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user even if API call fails
      setUser(null)
      if (typeof window !== 'undefined') {
        removeToken()
      }
      // Refresh auth state
      await checkAuth()
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    verify,
    isAuthenticated: !!user,
  }
}









