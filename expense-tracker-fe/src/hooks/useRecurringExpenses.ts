import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { RecurringExpensesResponse } from '@/lib/types'

export const useRecurringExpenses = () => {
    return useQuery({
        queryKey: ['expenses', 'recurring'],
        queryFn: async () => {
            const { data } = await apiClient.get<RecurringExpensesResponse>(ENDPOINTS.EXPENSES.RECURRING)
            return data
        },
    })
}
