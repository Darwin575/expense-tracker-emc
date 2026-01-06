import apiClient from './api'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
    status: 'success' | 'error'
    message: string
    data?: T
    errors?: any
}

const apiService = {
    /**
     * Performs a GET request.
     * @returns The `data` property of the response.
     */
    get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        try {
            const response = await apiClient.get<T>(url, config)
            return response.data
        } catch (error) {
            throw error
        }
    },

    /**
     * Performs a POST request.
     * @returns The `data` property of the response.
     */
    post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        try {
            const response = await apiClient.post<T>(url, data, config)
            return response.data
        } catch (error) {
            throw error
        }
    },

    /**
     * Performs a PUT request.
     * @returns The `data` property of the response.
     */
    put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        try {
            const response = await apiClient.put<T>(url, data, config)
            return response.data
        } catch (error) {
            throw error
        }
    },

    /**
     * Performs a PATCH request.
     * @returns The `data` property of the response.
     */
    patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        try {
            const response = await apiClient.patch<T>(url, data, config)
            return response.data
        } catch (error) {
            throw error
        }
    },

    /**
     * Performs a DELETE request.
     * @returns The `data` property of the response.
     */
    delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        try {
            const response = await apiClient.delete<T>(url, config)
            return response.data
        } catch (error) {
            throw error
        }
    },
}

export default apiService
