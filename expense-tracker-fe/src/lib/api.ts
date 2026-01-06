import axios from 'axios'
import { authService } from './auth-service'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token if available (matches AuthService logic)
        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('access_token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle errors globally
        if (error.response?.status === 401) {
            authService.notifySessionExpired()
        }
        return Promise.reject(error)
    }
)

export default apiClient
