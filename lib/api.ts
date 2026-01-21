import axios, { AxiosError } from 'axios'
import { apiCache } from './api-cache'
import { csrfStore } from './csrf-store'
import type {
  CarFeatures,
  PredictionRequest,
  PredictionResponse,
  HealthResponse,
  BatchPredictionResult,
  DatasetStats,
  SellCarRequest,
  SellCarResponse,
} from './types'

// Use NEXT_PUBLIC_API_BASE_URL in .env.production or .env.local
const isProduction = process.env.NODE_ENV === 'production'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (isProduction ? 'https://api.carwiseiq.com' : 'http://localhost:8000')
const AUTH_API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (isProduction ? 'https://api.carwiseiq.com' : 'http://localhost:8000')).replace(':3001', ':8000')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds default timeout
  withCredentials: true, // Include cookies for httpOnly token cookies
})

// Auth API uses the same backend as main API
const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Include cookies for httpOnly token cookies
})

// API instance for long-running operations (e.g., auto-detection)
const longRunningApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds (2 minutes) for AI inference
  withCredentials: true,
})

// Response caching for GET requests (5 minutes)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCacheKey = (config: any): string => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
}

const isCacheable = (config: any): boolean => {
  return config.method?.toLowerCase() === 'get' &&
    !config.headers?.['Cache-Control'] &&
    !config.headers?.['cache-control']
}

// Request interceptor: for FormData, remove Content-Type so browser sets multipart/form-data with boundary
api.interceptors.request.use((config) => {
  if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const h = config.headers as Record<string, unknown>
    if (h && 'Content-Type' in h) delete h['Content-Type']
  }
  return config
})

// Request interceptor: add X-CSRF-Token for state-changing methods (POST/PUT/PATCH/DELETE)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const m = (config.method || 'get').toLowerCase()
    if (['post', 'put', 'patch', 'delete'].includes(m)) {
      const t = csrfStore.get()
      if (t) (config.headers as Record<string, string>)['X-CSRF-Token'] = t
    }
  }
  return config
})

// Request interceptor to check cache BEFORE making request
api.interceptors.request.use((config) => {
  if (isCacheable(config)) {
    const cacheKey = getCacheKey(config)
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Mark as cached for response interceptor
      ; (config as any).__fromCache = true
        ; (config as any).__cachedData = cached.data
    }
  }
  return config
})

// Response interceptor for caching successful responses
api.interceptors.response.use(
  (response) => {
    // Check if this was from cache
    if ((response.config as any).__fromCache) {
      return {
        ...response,
        data: (response.config as any).__cachedData,
      }
    }

    // Cache successful GET responses
    const cacheKey = getCacheKey(response.config)
    if (isCacheable(response.config)) {
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      })
    }
    return response
  },
  (error) => {
    // Check if this was from cache but failed
    if ((error.config as any).__fromCache) {
      // Remove from cache and retry
      const cacheKey = getCacheKey(error.config)
      cache.delete(cacheKey)
      // Make actual request by removing cache flags
      delete (error.config as any).__fromCache
      delete (error.config as any).__cachedData
      return api.request(error.config)
    }
    return Promise.reject(error)
  }
)

// Token management
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

const setToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
  // Also set in axios default headers
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const removeToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  delete api.defaults.headers.common['Authorization']
}

// Request interceptor to add token to main API
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Request interceptor: /api/admin/* use only admin_token; /api/auth/* use only user token. Keep them separate.
authApi.interceptors.request.use((config) => {
  const u = config.url ? String(config.url) : ''
  const isUserLoginOrRegister = u.includes('/api/auth/login') || u.includes('/api/auth/register')
  const isAdminLogin = u.includes('/api/admin/login')
  if (isUserLoginOrRegister || isAdminLogin) {
    delete (config.headers as Record<string, unknown>)['Authorization']
    return config
  }
  if (u.includes('/api/admin/')) {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`
    else delete (config.headers as Record<string, unknown>)['Authorization']
    return config
  }
  const userToken = getToken()
  if (userToken) config.headers.Authorization = `Bearer ${userToken}`
  else delete (config.headers as Record<string, unknown>)['Authorization']
  return config
})

// Request interceptor: add X-CSRF-Token for state-changing methods (authApi)
authApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const m = (config.method || 'get').toLowerCase()
    if (['post', 'put', 'patch', 'delete'].includes(m)) {
      const t = csrfStore.get()
      if (t) (config.headers as Record<string, string>)['X-CSRF-Token'] = t
    }
  }
  return config
})

// Request interceptor to add token to long-running API (AI detect, etc.)
longRunningApi.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Request interceptor: add X-CSRF-Token for state-changing methods (longRunningApi)
longRunningApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const m = (config.method || 'get').toLowerCase()
    if (['post', 'put', 'patch', 'delete'].includes(m)) {
      const t = csrfStore.get()
      if (t) (config.headers as Record<string, string>)['X-CSRF-Token'] = t
    }
  }
  return config
})

// Response interceptor for auth API to handle errors globally and auto-refresh tokens
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const u = String(originalRequest?.url || '')

    // Admin 401: do not run user-token refresh or redirect to /en/login. Reject so admin layout can redirect to /admin/login.
    if (u.includes('/api/admin/') && error.response?.status === 401) {
      return Promise.reject(error)
    }

    // Do not refresh or redirect for login/register or for /refresh itself
    const isLoginOrRegister = u.includes('/api/auth/login') || u.includes('/api/auth/register')
    const isRefresh = u.includes('/api/auth/refresh')
    if (error.response?.status === 401 && (isLoginOrRegister || isRefresh)) {
      return Promise.reject(error)
    }

    // Handle 401 errors (token expired) on protected user-auth endpoints only
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return authApi(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      // Try to refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

      if (refreshToken) {
        try {
          // Call refresh endpoint directly to avoid circular dependency
          const response = await authApi.post('/api/auth/refresh', {
            refresh_token: refreshToken
          })
          const newToken = response.data.access_token

          if (newToken) {
            setToken(newToken)
            authApi.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            originalRequest.headers.Authorization = `Bearer ${newToken}`

            processQueue(null, newToken)
            isRefreshing = false

            // Retry original request
            return authApi(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          processQueue(refreshError, null)
          isRefreshing = false

          removeToken()
          if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token')
          }
          delete authApi.defaults.headers.common['Authorization']

          // Redirect to login if not already on login/register page
          if (typeof window !== 'undefined') {
            const pathname = window.location.pathname
            if (!pathname.includes('/login') && !pathname.includes('/register')) {
              window.location.href = '/en/login'
            }
          }
        }
      } else {
        // No refresh token: clear and redirect (no retry loop)
        processQueue(new Error('No refresh token'), null)
        isRefreshing = false
        removeToken()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refresh_token')
        }
        delete authApi.defaults.headers.common['Authorization']
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname
          if (!pathname.includes('/login') && !pathname.includes('/register')) {
            window.location.href = '/en/login'
          }
        }
      }
    }

    // Handle rate limiting (429) and account lockout
    if (error.response?.status === 429) {
      const errorMessage = error.response?.data?.detail || 'Too many requests. Please try again later.'
      // This will be handled by the UI component
    }

    return Promise.reject(error)
  }
)

// Response interceptor for main API to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeToken()
      delete api.defaults.headers.common['Authorization']
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        if (!pathname.includes('/login') && !pathname.includes('/register')) {
          window.location.href = '/en/login'
        }
      }
    } else if (error.response?.status === 404) {
      // Could redirect to 404 page if needed
      console.error('Resource not found:', error.config?.url)
    } else if (error.response?.status === 500) {
      // Could redirect to 500 error page
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        if (!pathname.includes('/errors')) {
          // Optionally redirect to error page
          // window.location.href = '/en/errors/server-error'
        }
      }
    } else if (!error.response && error.request) {
      // Network error
      console.error('Network error - check connection')
      // Could redirect to network error page
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        if (!pathname.includes('/errors')) {
          // Optionally redirect to error page
          // window.location.href = '/en/errors/network-error'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Error handler
const handleError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | string[]; message?: string }>

    // Handle validation errors (400, 422) - FastAPI returns detail
    if (axiosError.response?.status === 422 || axiosError.response?.status === 400) {
      const detail = axiosError.response.data?.detail
      if (Array.isArray(detail)) {
        // Format Pydantic validation errors
        return detail.map((err: any) => {
          const field = err.loc?.join('.') || 'field'
          const msg = err.msg || 'Invalid value'
          return `${field}: ${msg}`
        }).join(', ')
      }
      // FastAPI returns detail as string for custom errors (like password length)
      if (typeof detail === 'string') {
        return detail
      }
    }

    // Handle other errors with detail field
    const errorDetail = axiosError.response?.data?.detail
    if (typeof errorDetail === 'string') {
      return errorDetail
    }

    return axiosError.response?.data?.message || axiosError.message || 'An error occurred'
  }
  return error instanceof Error ? error.message : 'An unknown error occurred'
}

// API Functions
export const apiClient = {
  // Health check
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await api.get<HealthResponse>('/api/health')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Single prediction
  async predictPrice(features: CarFeatures | null | undefined, imageFeatures?: number[]): Promise<PredictionResponse> {
    try {
      // Validate input
      if (!features || typeof features !== 'object') {
        throw new Error('Invalid car features provided')
      }

      // Validate required fields
      if (!features.make || !features.model || !features.year) {
        throw new Error('Missing required fields: make, model, and year are required')
      }

      const requestBody: any = {
        features,
      }

      // Add image_features if provided
      if (imageFeatures && imageFeatures.length > 0) {
        requestBody.image_features = imageFeatures
      }

      const response = await api.post<PredictionResponse>('/api/predict', requestBody)

      // Validate response
      if (!response || !response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from server')
      }

      return response.data
    } catch (error) {
      console.error('predictPrice error:', error)
      throw new Error(handleError(error))
    }
  },

  // Batch prediction
  async predictBatch(cars: CarFeatures[]): Promise<BatchPredictionResult[]> {
    try {
      // Try to use batch endpoint if available, otherwise fall back to individual calls
      try {
        const response = await api.post<{ predictions: BatchPredictionResult[] }>('/api/predict/batch', {
          cars,
        })
        return response.data.predictions
      } catch (_batchError) {
        // Fallback: make individual calls
        const predictions: BatchPredictionResult[] = []

        for (let i = 0; i < cars.length; i++) {
          const car = cars[i]

          try {
            const result = await this.predictPrice(car)
            predictions.push({
              car,
              predicted_price: result.predicted_price,
              confidence_interval: result.confidence_interval,
            })
          } catch (carError: any) {
            console.error(`[API] Prediction ${i + 1}/${cars.length} failed:`, carError)
            // Include failed item with error message
            predictions.push({
              car,
              predicted_price: 0,
              confidence_interval: undefined,
              error: carError.message || 'Prediction failed',
            })
          }
        }

        return predictions
      }
    } catch (error) {
      console.error('❌ [API] Batch prediction failed completely:', error)
      throw new Error(handleError(error))
    }
  },

  // Get makes from backend dataset (with aggressive caching)
  async getMakes(): Promise<string[]> {
    return apiCache.getOrFetch(
      '/api/cars/makes',
      async () => {
        try {
          const response = await api.get<string[]>('/api/cars/makes')
          return response.data
        } catch (error) {
          // Fallback to constants if API fails
          const { CAR_MAKES } = await import('./constants')
          return CAR_MAKES
        }
      },
      undefined,
      30 * 60 * 1000 // 30 minutes cache
    )
  },

  // Get models for a make from backend dataset (with aggressive caching)
  async getModels(make: string): Promise<string[]> {
    return apiCache.getOrFetch(
      `/api/cars/models/${encodeURIComponent(make)}`,
      async () => {
        try {
          const response = await api.get<string[]>(`/api/cars/models/${encodeURIComponent(make)}`)
          return response.data
        } catch (error) {
          // Fallback to constants if API fails
          const { MODELS_BY_MAKE } = await import('./constants')
          return MODELS_BY_MAKE[make] || []
        }
      },
      { make },
      30 * 60 * 1000 // 30 minutes cache
    )
  },

  // Fallback when /api/cars/locations fails (dataset-only cities from iqcars_cleaned; no fake locations)
  async getLocations(): Promise<string[]> {
    const LOCATIONS_FALLBACK = [
      'Baghdad', 'Erbil', 'Basra', 'Mosul', 'Kirkuk', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Duhok',
      'Al-Fallujah', 'Ramadi', 'Samarra', 'Nasiriyah', 'Hillah', 'Kut', 'Amarah', 'Diwaniyah', 'Haswa',
      'Dhi Qar', 'Maysan', 'Muthanna', 'Anbar', 'Diala', 'Zaxo', 'Halabja', 'Chamchamal', 'Babil',
    ]
    return apiCache.getOrFetch(
      '/api/cars/locations',
      async () => {
        try {
          const response = await api.get<string[]>('/api/cars/locations')
          const data = Array.isArray(response?.data) ? response.data : []
          return data.length > 0 ? data : LOCATIONS_FALLBACK
        } catch {
          return LOCATIONS_FALLBACK
        }
      },
      undefined,
      30 * 60 * 1000 // 30 minutes cache
    )
  },

  async getTrims(make: string, model: string): Promise<string[]> {
    return apiCache.getOrFetch(
      `/api/cars/trims/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
      async () => {
        try {
          const response = await api.get<string[]>(`/api/cars/trims/${encodeURIComponent(make)}/${encodeURIComponent(model)}`)
          return response.data
        } catch (error) {
          throw new Error(handleError(error))
        }
      },
      { make, model },
      30 * 60 * 1000 // 30 minutes cache
    )
  },

  // Get all engine sizes from dataset (no make/model filter)
  async getAllEngineSizes(): Promise<Array<{ size: number; display: string }>> {
    try {
      const response = await api.get<number[]>(
        '/api/cars/engine-sizes',
        {
          headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
        }
      )
      // Convert to engine options with display names
      return response.data.map((size) => ({
        size,
        display: size === Math.floor(size) ? `${Math.floor(size)}L` : `${size}L`
      }))
    } catch (error) {
      console.error('Error fetching all engine sizes:', error)
      // Return common engine sizes as fallback
      const commonSizes = [1.0, 1.2, 1.4, 1.5, 1.6, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0]
      return commonSizes.map((size) => ({
        size,
        display: size === Math.floor(size) ? `${Math.floor(size)}L` : `${size}L`
      }))
    }
  },

  // Get available engines for a make/model
  async getAvailableEngines(make: string, model: string): Promise<Array<{ size: number; display: string }>> {
    try {
      const response = await api.get<{ engines: Array<{ size: number; display: string }> }>(
        `/api/available-engines?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
        {
          headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
        }
      )
      return response.data.engines || []
    } catch (error) {
      console.error('Error fetching engines:', error)
      return []
    }
  },

  // Get available cylinders for a make/model/engine
  async getAvailableCylinders(make: string, model: string, engine: number): Promise<number[]> {
    try {
      const response = await api.get<{ cylinders: number[] }>(
        `/api/available-cylinders?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&engine=${engine}`,
        {
          headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
        }
      )
      return response.data.cylinders || [4]
    } catch (error) {
      console.error('Error fetching cylinders:', error)
      return [4] // Default to 4 cylinders
    }
  },

  // Get available colors for a make/model
  async getAvailableColors(make: string, model: string): Promise<string[]> {
    try {
      const response = await api.get<{ colors: string[] }>(
        `/api/available-colors?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
        {
          headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
        }
      )
      return response.data.colors || []
    } catch (error) {
      console.error('Error fetching colors:', error)
      // Return default colors on error
      return ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Gold', 'Brown', 'Orange', 'Yellow', 'Purple', 'Beige', 'Other']
    }
  },

  // Get available fuel types for a make/model
  async getAvailableFuelTypes(make: string, model: string): Promise<string[]> {
    try {
      const response = await api.get<string[]>(
        `/api/cars/fuel-types/${encodeURIComponent(make)}/${encodeURIComponent(model)}`,
        {
          headers: { 'Cache-Control': 'max-age=300' }, // Cache for 5 minutes
        }
      )
      return response.data || []
    } catch (error) {
      console.error('Error fetching fuel types:', error)
      // Return default fuel types on error
      return ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other']
    }
  },

  // Get metadata (conditions, fuel types, ranges) - with caching
  async getMetadata(): Promise<{
    conditions: string[]
    fuel_types: string[]
    year_range: { min: number; max: number }
    mileage_range: { min: number; max: number }
  }> {
    return apiCache.getOrFetch(
      '/api/cars/metadata',
      async () => {
        try {
          const response = await api.get<{
            conditions: string[]
            fuel_types: string[]
            year_range: { min: number; max: number }
            mileage_range: { min: number; max: number }
          }>('/api/cars/metadata')
          return response.data
        } catch (error) {
          throw new Error(handleError(error))
        }
      },
      undefined,
      30 * 60 * 1000 // 30 minutes cache
    )
  },

  // Get dataset statistics
  async getStats(): Promise<DatasetStats> {
    try {
      // TODO: Implement GET /api/stats endpoint in backend
      // For now, return placeholder data
      return {
        total_cars: 62181,
        average_price: 18776,
        median_price: 16200,
        min_price: 1000,
        max_price: 200000,
        year_range: { min: 1948, max: 2025 },
      }
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Get statistics summary (for stats page visualizations)
  async getStatsSummary(): Promise<any> {
    try {
      const response = await api.get('/api/stats/summary')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Search cars by budget
  async searchBudget(params: {
    budget?: number
    min_price?: number
    max_price?: number
    make?: string
    model?: string
    min_year?: number
    max_year?: number
    max_mileage?: number
    condition?: string
    fuel_type?: string
    transmission?: string
    location?: string
    source?: 'database' | 'marketplace' | 'both'
    page?: number
    page_size?: number
  }): Promise<any> {
    try {
      const response = await api.get('/api/budget/search', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Export Excel
  async exportExcel(data: any): Promise<Blob> {
    try {
      // TODO: Implement POST /api/export/excel endpoint in backend
      // For now, create client-side export
      const XLSX = await import('xlsx')
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Predictions')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Export PDF
  async exportPDF(data: any): Promise<Blob> {
    try {
      // TODO: Implement POST /api/export/pdf endpoint in backend
      // For now, return placeholder
      throw new Error('PDF export not yet implemented')
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Download helper
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },

  // Authentication (FastAPI backend on port 8000)
  async register(
    email: string,
    password: string,
    confirmPassword: string,
    fullName?: string,
    termsAccepted: boolean = false
  ): Promise<{ token: string; refresh_token?: string; user: { id: number; email: string; full_name?: string; email_verified: boolean } }> {
    try {
      // Validate input
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        throw new Error('Email and password are required')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!termsAccepted) {
        throw new Error('You must accept the Terms of Service')
      }

      const response = await authApi.post<{
        access_token: string
        refresh_token?: string
        user: { id: number; email: string; full_name?: string; email_verified: boolean }
      }>('/api/auth/register', {
        email,
        password,
        confirm_password: confirmPassword,
        full_name: fullName,
        terms_accepted: termsAccepted
      })

      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server')
      }

      // Backend returns access_token, map it to token for compatibility
      const token = response.data.access_token
      if (token && typeof token === 'string') {
        setToken(token)
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // Store refresh token
      if (response.data.refresh_token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', response.data.refresh_token)
        }
      }

      // Validate user object
      if (!response.data.user || typeof response.data.user !== 'object') {
        throw new Error('Invalid user data received')
      }

      // Return with token field for compatibility
      return {
        token: token || '',
        refresh_token: response.data.refresh_token,
        user: response.data.user
      }
    } catch (error) {
      console.error('Register error:', error)
      throw new Error(handleError(error))
    }
  },

  async login(email: string, password: string, rememberMe: boolean = false): Promise<{ token: string; refresh_token?: string; user: { id: number; email: string; full_name?: string; email_verified: boolean } }> {
    try {
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        throw new Error('Email and password are required')
      }

      const response = await authApi.post<{
        access_token: string
        refresh_token?: string
        user: { id: number; email: string; full_name?: string; email_verified: boolean }
      }>('/api/auth/login', {
        email,
        password,
        remember_me: rememberMe
      })

      if (!response || !response.data) {
        throw new Error('Invalid response from server')
      }

      const token = response.data.access_token
      if (token && typeof token === 'string') {
        setToken(token)
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      if (response.data.refresh_token && typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }

      return {
        token: token || '',
        refresh_token: response.data.refresh_token,
        user: response.data.user
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(handleError(error))
    }
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const response = await authApi.post('/api/auth/refresh', { refresh_token: refreshToken })
      const token = response.data.access_token
      if (token) {
        setToken(token)
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      await authApi.post('/api/auth/verify-email', { token })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async resendVerification(email: string): Promise<void> {
    try {
      await authApi.post('/api/auth/resend-verification', { email })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await authApi.post('/api/auth/forgot-password', { email })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      await authApi.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async updateProfile(data: { full_name?: string; phone?: string; location?: string }): Promise<any> {
    try {
      const response = await authApi.put('/api/auth/profile', data)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      await authApi.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async updatePrivacySettings(settings: {
    privacy_show_phone?: boolean
    privacy_show_email?: boolean
    privacy_location_precision?: 'exact' | 'city'
    privacy_allow_ai_training?: boolean
  }): Promise<void> {
    try {
      await authApi.put('/api/auth/privacy-settings', settings)
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async exportData(): Promise<any> {
    try {
      const response = await authApi.get('/api/auth/export-data')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async deleteAccount(): Promise<void> {
    try {
      await authApi.delete('/api/auth/account')
      removeToken()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token')
      }
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await authApi.post('/api/auth/logout-all')
      removeToken()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token')
      }
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async saveCookieConsent(consent: { essential: boolean; analytics: boolean; marketing: boolean }): Promise<void> {
    try {
      await authApi.post('/api/auth/cookie-consent', consent)
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async logout(): Promise<void> {
    try {
      // Try to call logout endpoint if token exists
      const token = getToken()
      if (token) {
        await authApi.post('/api/auth/logout').catch(() => {
          // Ignore errors on logout
        })
      }
    } catch (error) {
      // Ignore errors
    } finally {
      removeToken()
      delete authApi.defaults.headers.common['Authorization']
    }
  },

  async getMe(): Promise<{ id: number; email: string; full_name?: string; phone?: string; location?: string; email_verified?: boolean }> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Cannot get user info on server side')
      }

      const token = getToken()
      if (!token || typeof token !== 'string') {
        throw new Error('No token found')
      }

      const response = await authApi.get<{ id: number; email: string; full_name?: string; phone?: string; location?: string; email_verified?: boolean }>('/api/auth/me')

      if (!response?.data || typeof response.data !== 'object' || typeof response.data.email !== 'string') {
        throw new Error('Invalid response from server')
      }

      return {
        id: response.data.id,
        email: response.data.email,
        full_name: response.data.full_name,
        phone: response.data.phone,
        location: response.data.location,
        email_verified: response.data.email_verified || false
      }
    } catch (error: any) {
      console.error('getMe error:', error)
      throw error // keep response so checkAuth can detect 401
    }
  },

  async verifyToken(): Promise<{ valid: boolean; user: { id: number; email: string } | null }> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return { valid: false, user: null }
      }

      const token = getToken()
      if (!token || typeof token !== 'string') {
        return { valid: false, user: null }
      }

      const response = await authApi.get<{ valid: boolean; user: { id: number; email: string } | null }>('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Validate response
      if (!response || !response.data || typeof response.data !== 'object') {
        return { valid: false, user: null }
      }

      return response.data
    } catch (error) {
      console.error('verifyToken error:', error)
      return { valid: false, user: null }
    }
  },

  // Sell car prediction
  async predictSellPrice(features: SellCarRequest, imageFeatures?: number[]): Promise<SellCarResponse> {
    try {
      const requestBody: any = { ...features }
      if (imageFeatures && imageFeatures.length > 0) {
        requestBody.image_features = imageFeatures
      }
      const response = await api.post<SellCarResponse>('/api/sell/predict', requestBody)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Analyze images
  async analyzeImages(files: File[]): Promise<{
    success: boolean
    data: {
      summary: string
      bullets: string[]
      guessed_make: string | null
      guessed_model: string | null
      guessed_color: string | null
      condition: string
      confidence: number
      image_features?: number[]
    }
  }> {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await api.post<{
        success: boolean
        data: {
          summary: string
          bullets: string[]
          guessed_make: string | null
          guessed_model: string | null
          guessed_color: string | null
          condition: string
          confidence: number
          image_features?: number[]
        }
      }>('/api/analyze-images', formData)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Predict price with images
  async predictPriceWithImages(
    features: CarFeatures,
    imageFeatures?: number[]
  ): Promise<PredictionResponse> {
    try {
      const requestBody: any = { features }
      if (imageFeatures && imageFeatures.length > 0) {
        requestBody.image_features = imageFeatures
      }
      const response = await api.post<PredictionResponse>('/api/predict', requestBody)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Get car image path based on make, model, year, trim
  async getCarImage(params: {
    make: string
    model: string
    year?: number
    trim?: string
  }): Promise<{
    image_path: string
    found: boolean
    match_type: string
    filename?: string
  }> {
    try {
      const queryParams = new URLSearchParams({
        make: params.make,
        model: params.model,
      })
      if (params.year) {
        queryParams.append('year', params.year.toString())
      }
      if (params.trim) {
        queryParams.append('trim', params.trim)
      }

      const response = await api.get<{
        image_path: string
        found: boolean
        match_type: string
        filename?: string
      }>(`/api/cars/car-image?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching car image:', error)
      return {
        image_path: '/images/cars/default-car.jpg',
        found: false,
        match_type: 'error'
      }
    }
  },

  // Predict from URL
  async predictFromUrl(url: string): Promise<{
    extracted_data: CarFeatures
    predicted_price: number
    listing_price?: number
    price_comparison?: {
      listing_price: number
      predicted_price: number
      difference: number
      difference_percent: number
      is_above_market: boolean
      is_below_market: boolean
    }
    confidence_interval?: {
      lower: number
      upper: number
    }
    message?: string
  }> {
    try {
      if (!url || typeof url !== 'string' || !url.trim()) {
        throw new Error('URL is required')
      }

      const response = await api.post<{
        success?: boolean
        data?: any
        error?: string
        extracted_data?: CarFeatures
        predicted_price?: number
        listing_price?: number
        price_comparison?: any
        confidence_interval?: { lower: number; upper: number }
        message?: string
      }>('/api/predict/from-url', { url: url.trim() })

      const d = response.data

      // Handle wrapped format: { success: true, data: {...} }
      if (d.success && d.data) {
        const data = d.data
        return {
          extracted_data: {
            make: data.make,
            model: data.model,
            year: data.year,
            mileage: data.mileage,
            condition: data.condition,
            fuel_type: data.fuel_type,
            location: data.location || 'Unknown',
            engine_size: data.engine_size || 2.0,
            cylinders: data.cylinders || 4,
          } as CarFeatures,
          predicted_price: data.predicted_price,
          listing_price: data.listing_price,
          confidence_interval: data.price_range ? { lower: data.price_range.min, upper: data.price_range.max } : undefined,
          price_comparison: data.listing_price && data.predicted_price ? {
            listing_price: data.listing_price,
            predicted_price: data.predicted_price,
            difference: data.listing_price - data.predicted_price,
            difference_percent: ((data.listing_price - data.predicted_price) / data.predicted_price) * 100,
            is_above_market: data.listing_price > data.predicted_price,
            is_below_market: data.listing_price < data.predicted_price,
          } : undefined,
          message: data.deal_explanation || data.message,
        }
      }

      // Handle direct UrlPredictionResponse: { extracted_data, predicted_price, ... }
      if (d.extracted_data && typeof d.predicted_price === 'number') {
        return {
          extracted_data: d.extracted_data,
          predicted_price: d.predicted_price,
          listing_price: d.listing_price,
          price_comparison: d.price_comparison,
          confidence_interval: d.confidence_interval,
          message: d.message,
        }
      }

      if (d.error) {
        throw new Error(typeof d.error === 'string' ? d.error : 'Unknown error')
      }

      throw new Error('Invalid response format from server')
    } catch (error: any) {
      // Enhanced error handling with specific error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Backend not running - Please start the backend server')
      }

      if (error.response?.status === 404) {
        throw new Error('Listing no longer available - The URL may be expired or removed')
      }

      if (error.response?.status === 408 || error.message?.includes('timeout')) {
        throw new Error('Timeout while scraping - The listing page took too long to respond')
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded - Please try again in 1 minute')
      }

      if (error.response?.status === 400) {
        const raw = error.response?.data?.detail
        const errorDetail = Array.isArray(raw)
          ? (raw.map((x: { msg?: string }) => x?.msg || JSON.stringify(x)).join('; ') || error.message)
          : (typeof raw === 'string' ? raw : error.message)
        if (String(errorDetail).includes('Unsupported platform') || String(errorDetail).includes('Invalid URL')) {
          throw new Error(`Invalid URL - ${errorDetail}`)
        }
        throw new Error(errorDetail || 'Invalid request')
      }

      // Use the error message from backend if available
      const errorMessage = handleError(error)
      throw new Error(errorMessage)
    }
  },

  // Save a prediction attempt (called automatically after prediction)
  async savePrediction(prediction: {
    car_features: CarFeatures
    predicted_price: number
    confidence_interval?: { lower: number; upper: number }
    confidence_level?: string
    image_features?: number[]
  }): Promise<{ prediction_id: number; success: boolean }> {
    try {
      // Build payload, filtering out undefined/null values
      const payload: any = {
        car_features: prediction.car_features || {},
        predicted_price: prediction.predicted_price
      }
      
      // Only include optional fields if they have values
      if (prediction.confidence_interval) {
        payload.confidence_interval = prediction.confidence_interval
      }
      if (prediction.confidence_level) {
        payload.confidence_level = prediction.confidence_level
      }
      if (prediction.image_features && Array.isArray(prediction.image_features) && prediction.image_features.length > 0) {
        payload.image_features = prediction.image_features
      }
      
      // Ensure car_features has required fields with safe defaults
      if (!payload.car_features.year && payload.car_features.year !== 0) {
        payload.car_features.year = payload.car_features.year || 2020
      }
      if (!payload.car_features.mileage && payload.car_features.mileage !== 0) {
        payload.car_features.mileage = payload.car_features.mileage || 0
      }
      if (!payload.car_features.engine_size && payload.car_features.engine_size !== 0) {
        payload.car_features.engine_size = payload.car_features.engine_size || 2.0
      }
      if (!payload.car_features.cylinders && payload.car_features.cylinders !== 0) {
        payload.car_features.cylinders = payload.car_features.cylinders || 4
      }
      if (!payload.car_features.make) {
        payload.car_features.make = payload.car_features.make || ''
      }
      if (!payload.car_features.model) {
        payload.car_features.model = payload.car_features.model || ''
      }
      if (!payload.car_features.condition) {
        payload.car_features.condition = payload.car_features.condition || 'Good'
      }
      if (!payload.car_features.location) {
        payload.car_features.location = payload.car_features.location || 'Unknown'
      }
      
      const response = await api.post<{ prediction_id: number; success: boolean }>(
        '/api/feedback/predictions',
        payload
      )
      return response.data
    } catch (error: any) {
      // Handle 422 validation errors gracefully
      if (error.response?.status === 422) {
        const errorDetail = error.response?.data?.detail || 'Validation error'
        console.warn('Prediction save validation error:', errorDetail)
        // Don't throw, just log - prediction still works without saving
        return { prediction_id: 0, success: false }
      }
      console.error('Error saving prediction:', error)
      // Don't throw for non-critical errors
      return { prediction_id: 0, success: false }
    }
  },

  // Submit feedback for a prediction
  async submitFeedback(feedback: {
    prediction_id: number
    rating?: number
    is_accurate?: boolean
    feedback_type?: 'accurate' | 'inaccurate' | 'partial'
    feedback_reasons?: string[]
    correct_make?: string
    correct_model?: string
    correct_year?: number
    correct_price?: number
    other_details?: string
  }): Promise<{ feedback_id: number; success: boolean; message: string }> {
    try {
      const response = await api.post<{ feedback_id: number; success: boolean; message: string }>(
        '/api/feedback/submit',
        feedback
      )
      return response.data
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw new Error(handleError(error))
    }
  },

  // Get prediction history
  async getPredictionHistory(limit: number = 50, offset: number = 0): Promise<{
    predictions: Array<{
      id: number
      car_features: CarFeatures
      predicted_price: number
      confidence_interval?: { lower: number; upper: number }
      confidence_level?: string
      timestamp: string
      feedback?: {
        rating?: number
        is_accurate?: boolean
        feedback_type?: string
        feedback_reasons?: string[]
        correct_make?: string
        correct_model?: string
        correct_price?: number
        updated_at?: string
      }
    }>
    total: number
    message: string
  }> {
    try {
      const response = await api.get('/api/feedback/history', {
        params: { limit, offset }
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Get feedback metrics
  async getFeedbackMetrics(): Promise<{
    overall: {
      total_feedback: number
      avg_rating: number
      accuracy_percent: number
      positive_feedback_percent: number
    }
    by_make: Array<{
      make: string
      count: number
      avg_rating: number
      accuracy_percent: number
    }>
    trend: Array<{
      date: string
      avg_rating: number
      accuracy_percent: number
    }>
    improvement?: {
      improvement_percent: number
      improvement_absolute: number
      current_period: {
        accuracy_percent: number
        total_feedback: number
      }
      previous_period: {
        accuracy_percent: number
        total_feedback: number
      }
    }
  }> {
    try {
      const response = await api.get('/api/feedback/metrics')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Admin API (Next.js /api/admin/*: login, logout, me use httpOnly cookie + optional localStorage token for backend)
  async adminLogin(email: string, password: string): Promise<{ access_token: string; admin: { id: number; email: string; name: string; role: string } }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Invalid email or password')
      if (data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('admin_token', data.access_token)
      }
      return { access_token: data.access_token, admin: data.admin }
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async adminLogout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
      }
    }
  },

  async getAdminMe(): Promise<{ id: number; email: string; name: string; role: string }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const res = await fetch('/api/admin/me', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Not authenticated')
      return res.json()
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getDashboardStats(): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/dashboard/stats')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getPredictionsOverTime(days: number = 30): Promise<any[]> {
    try {
      const response = await authApi.get(`/api/admin/dashboard/charts/predictions-over-time?days=${days}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getFeedbackRatings(): Promise<any[]> {
    try {
      const response = await authApi.get('/api/admin/dashboard/charts/feedback-ratings')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getAccuracyTrend(days: number = 30): Promise<any[]> {
    try {
      const response = await authApi.get(`/api/admin/dashboard/charts/accuracy-trend?days=${days}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getFeedbackList(params: {
    page?: number
    page_size?: number
    rating?: number
    accuracy?: string
    make?: string
    search?: string
    date_from?: string
    date_to?: string
  }): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/feedback', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getFeedbackDetail(feedbackId: number): Promise<any> {
    try {
      const response = await authApi.get(`/api/admin/feedback/${feedbackId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getUsersList(params: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/users', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getUserDetail(userId: number): Promise<any> {
    try {
      const response = await authApi.get(`/api/admin/users/${userId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      await authApi.delete(`/api/admin/users/${userId}`)
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getSettings(): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/settings')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async triggerModelRetrain(): Promise<any> {
    try {
      const response = await authApi.post('/api/admin/settings/model/retrain')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getDailyFeedbackReport(date?: string): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/reports/daily-feedback', {
        params: date ? { date } : {}
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getMarketplaceAnalytics(): Promise<any> {
    try {
      const response = await authApi.get('/api/admin/dashboard/marketplace-analytics')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getAdminListings(params: {
    page?: number
    page_size?: number
    status?: string
    search?: string
  } = {}): Promise<{ items: any[]; total: number }> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const q = new URLSearchParams()
      if (params.page != null) q.set('page', String(params.page))
      if (params.page_size != null) q.set('page_size', String(params.page_size))
      if (params.status) q.set('status', params.status)
      if (params.search) q.set('search', params.search)
      const res = await fetch(`/api/admin/listings?${q.toString()}`, {
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Failed to load listings')
      return { items: data.items ?? data.listings ?? [], total: data.total ?? 0 }
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async adminPatchListing(id: number, body: { status?: string; [k: string]: unknown }): Promise<any> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Update failed')
      return data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async adminDeleteListing(id: number): Promise<void> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Delete failed')
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Marketplace API
  async createListing(listing: any): Promise<{ listing_id: number; success: boolean }> {
    try {
      const response = await api.post('/api/marketplace/listings', listing)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async createDraftListing(listingData?: any): Promise<{ listing_id: number; success: boolean }> {
    try {
      const response = await api.post('/api/marketplace/listings/draft', listingData || {})
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async uploadListingImages(listingId: number, images: File[]): Promise<{ success: boolean; image_ids: number[]; image_urls: string[] }> {
    try {
      const formData = new FormData()
      images.forEach((img) => formData.append('images', img))
      const response = await api.post(`/api/marketplace/listings/${listingId}/images`, formData)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async deleteListingImage(listingId: number, imageId: number): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`/api/marketplace/listings/${listingId}/images/${imageId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async autoDetectCar(listingId: number): Promise<{
    success: boolean
    status?: 'ok' | 'low_confidence' | 'error'
    error?: string
    detection: any
    prefill: { make?: string; model?: string; color?: string; year?: number }
    confidence_level?: 'high' | 'medium' | 'low'
  }> {
    try {
      // Use long-running API instance with 120 second timeout
      const response = await longRunningApi.post(`/api/marketplace/listings/${listingId}/auto-detect`)
      return response.data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { status?: string } }; code?: string; message?: string }
      // If backend returns error response (not exception), return it
      if (error.response?.data?.status === 'error') {
        return error.response.data as { success: boolean; status?: 'ok' | 'low_confidence' | 'error'; error?: string; detection: any; prefill: { make?: string; model?: string; color?: string; year?: number }; confidence_level?: 'high' | 'medium' | 'low' }
      }
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          status: 'error',
          error: 'Detection timed out. The AI model may be loading. Please try again in a moment.',
          detection: null,
          prefill: {}
        }
      }
      throw new Error(handleError(err))
    }
  },

  /**
   * Claude vision: detect car make and model from 4-10 images (base64).
   * Used by sell step2 when user uploads 4-10 photos and clicks Next.
   * Returns { make?, model?, confidence, error? }.
   */
  async detectCarVision(files: File[]): Promise<{ make?: string | null; model?: string | null; confidence: number; error?: string }> {
    try {
      const readAsBase64 = (f: File): Promise<{ data: string; media_type: string }> =>
        new Promise((res, rej) => {
          const r = new FileReader()
          r.onload = () => {
            const s = String(r.result)
            const data = s.includes(',') ? s.split(',')[1]! : s
            const media = (f.type || 'image/jpeg').toLowerCase()
            const media_type = /^image\/(jpeg|png|webp|gif)$/i.test(media) ? media : 'image/jpeg'
            res({ data, media_type })
          }
          r.onerror = rej
          r.readAsDataURL(f)
        })
      const images = await Promise.all(files.map(readAsBase64))
      const response = await longRunningApi.post<{ make?: string | null; model?: string | null; confidence: number; error?: string }>(
        '/api/ai/detect-car-vision',
        { images }
      )
      return response.data
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes?.('timeout')) {
        return { make: null, model: null, confidence: 0, error: 'Detection timed out. Please try again.' }
      }
      const msg = handleError(err)
      return { make: null, model: null, confidence: 0, error: msg }
    }
  },

  async updateDraftListing(listingId: number, data: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.patch(`/api/marketplace/listings/${listingId}`, data)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async updateListingUserOverrides(listingId: number, selectedByUser: {
    make?: string
    model?: string
    color?: string
    year?: string
  }): Promise<any> {
    try {
      const response = await api.put(`/api/marketplace/listings/${listingId}/user-overrides`, {
        selected_by_user: selectedByUser,
        user_overrode: true
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getListing(listingId: number): Promise<any> {
    try {
      const response = await api.get(`/api/marketplace/listings/${listingId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getListingAnalytics(listingId: number): Promise<any> {
    try {
      const response = await api.get(`/api/marketplace/listings/${listingId}/analytics`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getMyListings(status?: string): Promise<any> {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/api/marketplace/my-listings', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async markListingAsSold(listingId: number): Promise<any> {
    try {
      const response = await api.put(`/api/marketplace/listings/${listingId}/mark-sold`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async markListingAsAvailable(listingId: number): Promise<any> {
    try {
      const response = await api.put(`/api/marketplace/listings/${listingId}/mark-available`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async deleteListing(listingId: number): Promise<any> {
    try {
      const response = await api.delete(`/api/marketplace/listings/${listingId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async reportListing(listingId: number, data: { reason: string; details: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/api/marketplace/listings/${listingId}/report`, data)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async searchListings(params: {
    page?: number
    page_size?: number
    sort_by?: string
    search?: string
    min_price?: number
    max_price?: number
    makes?: string
    models?: string
    min_year?: number
    max_year?: number
    max_mileage?: number
    conditions?: string
    transmissions?: string
    fuel_types?: string
    location_city?: string
  }): Promise<any> {
    try {
      const response = await api.get('/api/marketplace/listings', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async saveListing(listingId: number): Promise<any> {
    try {
      const response = await api.post(`/api/marketplace/listings/${listingId}/save`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async unsaveListing(listingId: number): Promise<any> {
    try {
      const response = await api.delete(`/api/marketplace/listings/${listingId}/save`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async publishListing(listingId: number): Promise<any> {
    try {
      const response = await api.put(`/api/marketplace/listings/${listingId}/publish`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  // Favorites API
  async toggleFavorite(listingId: number): Promise<any> {
    try {
      const response = await api.post('/api/favorites/toggle', null, {
        params: { listing_id: listingId }
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async checkFavorite(listingId: number): Promise<any> {
    try {
      const response = await api.get(`/api/favorites/check/${listingId}`)
      return response.data
    } catch (error) {
      return { is_favorite: false }
    }
  },

  async getFavorites(params: {
    page?: number
    page_size?: number
    sort_by?: string
  }): Promise<any> {
    try {
      const response = await api.get('/api/favorites/list', { params })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getFavoritesCount(listingId: number): Promise<number> {
    try {
      const response = await api.get(`/api/favorites/count/${listingId}`)
      return response.data.count || 0
    } catch (error) {
      return 0
    }
  },

  async saveSearch(name: string, filters: any, emailAlerts: boolean = true, frequency: string = 'instant'): Promise<any> {
    try {
      const response = await api.post('/api/favorites/searches', {
        name,
        filters,
        email_alerts: emailAlerts,
        frequency
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getSavedSearches(): Promise<any> {
    try {
      const response = await api.get('/api/favorites/searches')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async updateSavedSearch(searchId: number, updates: {
    name?: string
    email_alerts?: boolean
    frequency?: string
  }): Promise<any> {
    try {
      const response = await api.put(`/api/favorites/searches/${searchId}`, updates)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async deleteSavedSearch(searchId: number): Promise<any> {
    try {
      const response = await api.delete(`/api/favorites/searches/${searchId}`)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getPriceHistory(listingId: number, days: number = 30): Promise<any> {
    try {
      const response = await api.get(`/api/favorites/price-history/${listingId}`, {
        params: { days }
      })
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async getNotificationSettings(): Promise<any> {
    try {
      const response = await api.get('/api/favorites/notifications/settings')
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },

  async updateNotificationSettings(settings: {
    email_new_matches?: boolean
    email_price_drops?: boolean
    push_notifications?: boolean
    frequency?: string
  }): Promise<any> {
    try {
      const response = await api.put('/api/favorites/notifications/settings', settings)
      return response.data
    } catch (error) {
      throw new Error(handleError(error))
    }
  },
}

// Export token management functions
export { getToken, setToken, removeToken }

