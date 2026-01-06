import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { BudgetAlertResponse, Budget, CreateBudgetData } from '@/lib/types'

// Fetch budget alerts (usage analysis)
export const useBudgetAlerts = () => {
    return useQuery({
        queryKey: ['budget', 'alerts'],
        queryFn: async () => {
            const { data } = await apiClient.get<{ data: BudgetAlertResponse }>(ENDPOINTS.BUDGETS.ALERTS)
            return data.data
        },
    })
}

// Fetch all budgets (CRUD)
export const useBudgets = () => {
    return useQuery({
        queryKey: ['budgets'],
        queryFn: async () => {
            const { data } = await apiClient.get<any>(ENDPOINTS.BUDGETS.LIST)
            // Handle pagination (DRF returns { count: number, results: [] })
            if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
                return data.results as Budget[]
            }
            // Handle non-paginated array
            if (Array.isArray(data)) {
                return data as Budget[]
            }
            return []
        },
    })
}

// Helper function to invalidate all budget-related queries
const invalidateBudgetRelatedQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    queryClient.invalidateQueries({ queryKey: ['budget', 'alerts'] })
    // Invalidate dashboard stats since budget info may appear there
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}

// Create Budget
export const useCreateBudget = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateBudgetData) => {
            const res = await apiClient.post<Budget>(ENDPOINTS.BUDGETS.LIST, data)
            return res.data
        },
        onSuccess: () => {
            invalidateBudgetRelatedQueries(queryClient)
        },
    })
}

// Update Budget
export const useUpdateBudget = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Budget> & { id: number }) => {
            const res = await apiClient.patch<Budget>(ENDPOINTS.BUDGETS.DETAIL(id), updates)
            return res.data
        },
        onSuccess: () => {
            invalidateBudgetRelatedQueries(queryClient)
        },
    })
}

// Delete Budget
export const useDeleteBudget = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(ENDPOINTS.BUDGETS.DETAIL(id))
        },
        onSuccess: () => {
            invalidateBudgetRelatedQueries(queryClient)
        },
    })
}
