import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { Expense, CreateExpenseData, PaginatedResponse } from '@/lib/types'

// Helper function to invalidate all expense-related queries
const invalidateExpenseRelatedQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
    // Invalidate expense list and recurring expenses (uses ['expenses', 'recurring'])
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    // Invalidate dashboard stats
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    // Invalidate all analytics queries (category-breakdown, weekly-spending, monthly-trend, payment-breakdown)
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    // Invalidate budget alerts (expense changes affect budget usage)
    queryClient.invalidateQueries({ queryKey: ['budget', 'alerts'] })
}

// Fetch all expenses
export const useExpenses = () => {
    return useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const { data } = await apiClient.get<Expense[]>('/expenses/')
            return data
        },
    })
}

// Fetch single expense
export const useExpense = (id: number) => {
    return useQuery({
        queryKey: ['expense', id],
        queryFn: async () => {


            const { data } = await apiClient.get<Expense>(`/expenses/${id}/`)
            return data
        },
        enabled: !!id,
    })
}

// Create expense
export const useCreateExpense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newExpense: CreateExpenseData) => {


            const { data } = await apiClient.post<Expense>('/expenses/', newExpense)
            return data
        },
        onSuccess: () => {
            invalidateExpenseRelatedQueries(queryClient)
        },
    })
}

// Update expense
export const useUpdateExpense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: number }) => {

            const { data } = await apiClient.patch<Expense>(`/expenses/${id}/`, updates)
            return data
        },
        onSuccess: (data) => {
            invalidateExpenseRelatedQueries(queryClient)
            queryClient.invalidateQueries({ queryKey: ['expense', data.id] })
        },
    })
}

// Delete expense
export const useDeleteExpense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: number) => {

            await apiClient.delete(`/expenses/${id}/`)
        },
        onSuccess: () => {
            invalidateExpenseRelatedQueries(queryClient)
        },
    })
}
