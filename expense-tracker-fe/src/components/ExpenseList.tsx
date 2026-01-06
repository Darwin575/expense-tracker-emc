'use client'

import type { Expense } from '@/lib/types'
import { useDeleteExpense } from '@/hooks/useExpenses'

interface ExpenseListProps {
    expenses: Expense[]
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
    const deleteExpense = useDeleteExpense()

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            deleteExpense.mutate(id)
        }
    }

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    if (expenses.length === 0) {
        return (
            <div className="text-center py-12">
                <svg
                    className="mx-auto h-24 w-24 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
                    No expenses yet
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Get started by adding your first expense.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {expenses.map((expense) => (
                <div
                    key={expense.id}
                    className="group bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                {expense.title}
                            </h3>
                            {expense.description && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                                    {expense.description}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {expense.payment_method}
                                </span>
                                {expense.category_name && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {expense.category_name}
                                    </span>
                                )}
                                <span className="text-slate-500 dark:text-slate-500 text-xs flex items-center">
                                    {formatDate(expense.date)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right ml-4">
                            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {formatCurrency(expense.amount)}
                            </p>
                            <button
                                onClick={() => handleDelete(expense.id)}
                                disabled={deleteExpense.isPending}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                                {deleteExpense.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
