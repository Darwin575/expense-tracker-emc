import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import apiService from '@/lib/api-service'
import { ENDPOINTS } from '@/lib/endpoints'
import { AxiosError } from 'axios'

// --- Types ---
type ApiError = AxiosError<any>

// --- Query Hook ---

/**
 * Custom hook for fetching data using GET request.
 * @param key Unique key for the query (e.g., ['expenses', 'list'])
 * @param url API endpoint URL
 * @param options React Query options
 */
export function useFetch<T = any>(
    key: any[],
    url: string,
    options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<T, ApiError>({
        queryKey: key,
        queryFn: () => apiService.get<T>(url),
        ...options,
    })
}

// --- Mutation Hooks ---

/**
 * Custom hook for creating data using POST request.
 * @param url API endpoint URL
 * @param options React Query mutation options
 */
export function usePost<T = any, D = any>(
    url: string,
    options?: UseMutationOptions<T, ApiError, D>
) {
    const queryClient = useQueryClient()
    return useMutation<T, ApiError, D>({
        mutationFn: (data) => apiService.post<T>(url, data),
        onSuccess: () => {
            // Invalidate queries if needed, but better to let the component handle it via options
        },
        ...options,
    })
}

/**
 * Custom hook for updating data using PUT request.
 * @param urlFn Function that takes the variables and returns the URL (useful for dynamic IDs)
 *              OR a static string URL
 * @param options React Query mutation options
 */
export function usePut<T = any, D = any>(
    urlOrFn: string | ((data: D) => string),
    options?: UseMutationOptions<T, ApiError, D>
) {
    return useMutation<T, ApiError, D>({
        mutationFn: (data) => {
            const url = typeof urlOrFn === 'function' ? urlOrFn(data) : urlOrFn
            return apiService.put<T>(url, data)
        },
        ...options,
    })
}

/**
 * Custom hook for updating data using PATCH request.
 * @param urlFn Function that takes the variables and returns the URL
 *              OR a static string URL
 * @param options React Query mutation options
 */
export function usePatch<T = any, D = any>(
    urlOrFn: string | ((data: D) => string),
    options?: UseMutationOptions<T, ApiError, D>
) {
    return useMutation<T, ApiError, D>({
        mutationFn: (data) => {
            const url = typeof urlOrFn === 'function' ? urlOrFn(data) : urlOrFn
            return apiService.patch<T>(url, data)
        },
        ...options,
    })
}

/**
 * Custom hook for deleting data using DELETE request.
 * @param urlFn Function that takes the variables (e.g., ID) and returns the URL
 *              OR a static string URL
 * @param options React Query mutation options
 */
export function useDelete<T = any, V = any>(
    urlOrFn: string | ((variables: V) => string),
    options?: UseMutationOptions<T, ApiError, V>
) {
    return useMutation<T, ApiError, V>({
        mutationFn: (variables) => {
            const url = typeof urlOrFn === 'function' ? urlOrFn(variables) : urlOrFn
            return apiService.delete<T>(url)
        },
        ...options,
    })
}

// --- Auth Convenience Hooks ---

/**
 * Login mutation hook
 */
export function useLogin<T = any, D = any>(options?: UseMutationOptions<T, ApiError, D>) {
    return usePost<T, D>(ENDPOINTS.AUTH.LOGIN, options)
}

/**
 * Register mutation hook
 */
export function useRegister<T = any, D = any>(options?: UseMutationOptions<T, ApiError, D>) {
    return usePost<T, D>(ENDPOINTS.AUTH.REGISTER, options)
}

/**
 * Request credential reset mutation hook
 */
export function useRequestCredentialReset<T = any, D = any>(options?: UseMutationOptions<T, ApiError, D>) {
    return usePost<T, D>(ENDPOINTS.AUTH.REQUEST_CREDENTIAL_RESET, options)
}
