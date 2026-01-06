import axios, { AxiosInstance } from 'axios'
import { authService } from './auth-service'
import { ENDPOINTS } from '@/lib/endpoints'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  requested_credential_reset: boolean
  date_joined: string
}

export interface AdminStats {
  total_users: number
  admin_users: number
  regular_users: number
  active_users: number
}

class AdminService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authService.notifySessionExpired()
        }
        return Promise.reject(error)
      }
    )
  }

  async getUsers(
    page = 1,
    filters?: { role?: string; is_active?: boolean }
  ): Promise<{
    count: number
    next: string | null
    previous: string | null
    results: AdminUser[]
  }> {
    const params = new URLSearchParams()
    params.append('page', page.toString())

    if (filters?.role) {
      params.append('role', filters.role)
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString())
    }

    const response = await this.client.get(`/admin/users/?${params.toString()}`)
    return response.data
  }

  async getUser(id: number): Promise<AdminUser> {
    const response = await this.client.get(`/admin/users/${id}/`)
    return response.data
  }

  async updateUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await this.client.patch(`/admin/users/${id}/`, data)
    return response.data
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/admin/users/${id}/`)
  }

  async promoteToAdmin(id: number): Promise<AdminUser> {
    const response = await this.client.post(`/admin/users/${id}/make_staff/`)
    return response.data
  }

  async demoteToUser(id: number): Promise<AdminUser> {
    const response = await this.client.post(`/admin/users/${id}/remove_staff/`)
    return response.data
  }

  async toggleActive(id: number): Promise<AdminUser> {
    const response = await this.client.post(`/admin/users/${id}/toggle_active/`)
    return response.data
  }

  async getStats(): Promise<AdminStats> {
    const response = await this.client.get('/admin/users/stats/')
    return response.data
  }

  async resetUserCredentials(
    id: number,
    email: string,
    password: string
  ): Promise<AdminUser> {
    const response = await this.client.post(`/admin/users/${id}/reset_credentials/`, {
      email,
      password,
    })
    return response.data
  }
}

export const adminService = new AdminService()
