import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { Category, CreateCategoryData, PaginatedResponse } from '@/lib/types'

// Helper function to invalidate all category-related queries
const invalidateCategoryRelatedQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
    // Invalidate categories list
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    // Invalidate category breakdown analytics (shows spending by category)
    queryClient.invalidateQueries({ queryKey: ['analytics', 'category-breakdown'] })
    // Invalidate budget alerts (budgets are linked to categories)
    queryClient.invalidateQueries({ queryKey: ['budget', 'alerts'] })
    // Invalidate budgets list (budgets reference categories)
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    // Invalidate expenses (they display category names)
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    // Invalidate dashboard stats (recent expenses show category info)
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}

// Fetch all categories
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {



            const { data } = await apiClient.get<PaginatedResponse<Category> | Category[]>('/categories/')
            return Array.isArray(data) ? data : data.results
        },
    })
}

// Fetch single category
export const useCategory = (id: number) => {
    return useQuery({
        queryKey: ['category', id],
        queryFn: async () => {

            const { data } = await apiClient.get<Category>(`/categories/${id}/`)
            return data
        },
        enabled: !!id,
    })
}

// Create category
export const useCreateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newCategory: CreateCategoryData) => {

            const { data } = await apiClient.post<Category>('/categories/', newCategory)
            return data
        },
        onSuccess: () => {
            invalidateCategoryRelatedQueries(queryClient)
        },
    })
}

// Update category
export const useUpdateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Category> & { id: number }) => {

            const { data } = await apiClient.patch<Category>(`/categories/${id}/`, updates)
            return data
        },
        onSuccess: (data) => {
            invalidateCategoryRelatedQueries(queryClient)
            queryClient.invalidateQueries({ queryKey: ['category', data.id] })
        },
    })
}

// Delete category
export const useDeleteCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: number) => {

            await apiClient.delete(`/categories/${id}/`)
        },
        onSuccess: () => {
            invalidateCategoryRelatedQueries(queryClient)
        },
    })
}
