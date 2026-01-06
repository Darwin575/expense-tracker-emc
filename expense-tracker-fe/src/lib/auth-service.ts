import axios, { AxiosInstance } from 'axios'
import { ENDPOINTS } from '@/lib/endpoints'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  username: string
  password: string
  password2: string
}

interface AuthResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
  }
}

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
}

class AuthService {
  private client: AxiosInstance
  private isLoggingOut = false

  private eventBus = new EventTarget()

  constructor() {
    console.log('AuthService initialized with API URL:', API_BASE_URL)
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Handle errors - don't auto-refresh, just clear tokens
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const isLoginRequest = error.config?.url?.includes(ENDPOINTS.AUTH.LOGIN)

        // If 401 and not already logging out, and NOT a login request
        if (error.response?.status === 401 && !this.isLoggingOut && !isLoginRequest) {
          this.notifySessionExpired()
        }
        return Promise.reject(error)
      }
    )
  }

  notifySessionExpired() {
    this.clearTokens()
    this.eventBus.dispatchEvent(new Event('session-expired'))
  }

  onSessionExpired(callback: () => void) {
    this.eventBus.addEventListener('session-expired', callback)
    return () => this.eventBus.removeEventListener('session-expired', callback)
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.client.post<any>(ENDPOINTS.AUTH.LOGIN, credentials)

      // Extract data from success_response wrapper
      const authData = response.data.data || response.data

      if (authData.access && authData.refresh) {
        this.setAccessToken(authData.access)
        this.setRefreshToken(authData.refresh)
      }
      return authData
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Login failed'
      throw new Error(errorMessage)
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ email: string; message: string }> {
    try {
      const response = await this.client.post<{ email: string; message: string }>(ENDPOINTS.AUTH.REGISTER, credentials)
      return response.data
    } catch (error: any) {
      const errorData = error.response?.data

      // Helper to extract first error message
      const getErrorMsg = (field: any) => {
        if (!field) return null
        if (Array.isArray(field)) return field[0]
        if (typeof field === 'string') return field
        return null
      }

      const message =
        getErrorMsg(errorData?.email) ||
        getErrorMsg(errorData?.username) ||
        getErrorMsg(errorData?.password) ||
        getErrorMsg(errorData?.password2) ||
        getErrorMsg(errorData?.non_field_errors) ||
        getErrorMsg(errorData?.detail) ||
        // Fallback to first available error if any
        (errorData && typeof errorData === 'object' ? getErrorMsg(Object.values(errorData)[0]) : null) ||
        'Registration failed'

      throw new Error(message)
    }
  }

  async requestCredentialReset(email: string): Promise<{ message: string }> {
    try {
      const response = await this.client.post<{ message: string }>(ENDPOINTS.AUTH.REQUEST_CREDENTIAL_RESET, { email })
      return response.data
    } catch (error: any) {
      const errorData = error.response?.data
      throw new Error(
        errorData?.detail ||
        'Failed to submit credential reset request'
      )
    }
  }

  async logout(): Promise<void> {
    this.isLoggingOut = true
    try {
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        try {
          await this.client.post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken })
        } catch (error) {
          // Ignore errors during logout
          console.error('Logout error:', error)
        }
      }
    } finally {
      this.clearTokens()
      this.isLoggingOut = false
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get<any>(ENDPOINTS.AUTH.ME)
      // Extract user data from success_response wrapper
      return response.data.data || response.data
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access: string }> {
    try {
      const response = await this.client.post<{ access: string }>('/refresh/', {
        refresh: refreshToken,
      })
      return response.data
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  private setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', token)
    }
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token)
    }
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('access_token')
    }
    return null
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token')
    }
    return null
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }
}

export const authService = new AuthService()
export type { AuthResponse, User, LoginCredentials, RegisterCredentials }
