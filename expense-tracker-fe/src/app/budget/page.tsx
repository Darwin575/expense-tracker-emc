'use client'

import { useState } from 'react'
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudget'
import { Plus, Trash2, Edit2, X, Check, Save } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { PaginationFooter } from "@/components/paginationfooter";

export default function BudgetPage() {
    // Data Hooks
    const { data: budgets, isLoading } = useBudgets()
    const createBudgetMutation = useCreateBudget()
    const updateBudgetMutation = useUpdateBudget()
    const deleteBudget = useDeleteBudget()

    // UI/Filter State
    const [searchQuery, setSearchQuery] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [month, setMonth] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Form Logic
    const resetForm = () => {
        setIsFormOpen(false)
        setEditingId(null)
        setMonth('')
        setAmount('')
        setError(null)
    }

    const handleAddClick = () => {
        setEditingId(null)
        setMonth('')
        setAmount('')
        setError(null)
        setIsFormOpen(true)
    }

    const handleEditClick = (budget: any) => {
        setEditingId(budget.id)
        // Extract YYYY-MM
        const monthValue = budget.month.length > 7 ? budget.month.substring(0, 7) : budget.month
        setMonth(monthValue)
        setAmount(String(budget.budget_amount))
        setError(null)
        setIsFormOpen(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const formattedMonth = month.length === 7 ? `${month}-01` : month

        const mutationOptions = {
            onSuccess: resetForm,
            onError: (err: any) => {
                const responseData = err.response?.data
                if (responseData) {
                    if (typeof responseData === 'object') {
                        const messages = Object.values(responseData).flat()
                        if (messages.length > 0) {
                            let message = String(messages[0])
                            if (message.includes('unique set')) {
                                message = 'A budget for this month already exists.'
                            }
                            setError(message)
                            return
                        }
                    }
                }
                setError('Failed to save budget.')
            }
        }

        if (editingId) {
            updateBudgetMutation.mutate({
                id: editingId,
                month: formattedMonth,
                budget_amount: String(parseFloat(amount))
            }, mutationOptions)
        } else {
            createBudgetMutation.mutate({
                month: formattedMonth,
                budget_amount: parseFloat(amount)
            }, mutationOptions)
        }
    }

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this budget?')) {
            deleteBudget.mutate(id)
        }
    }

    // Filtering Logic
    const budgetList = Array.isArray(budgets) ? budgets : (budgets as any)?.results ?? []

    // Helper to format month for display/search
    const getFormattedMonth = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMMM yyyy')
        } catch (e) {
            return dateStr
        }
    }

    const filteredBudgets = budgetList.filter((budget: any) => {
        const lowerQuery = searchQuery.toLowerCase()
        const monthDisplay = getFormattedMonth(budget.month).toLowerCase()
        const amountDisplay = String(budget.budget_amount)

        const matchesSearch = monthDisplay.includes(lowerQuery) || amountDisplay.includes(lowerQuery)

        // Date Range Logic (Month comparison)
        const budgetMonth = budget.month.substring(0, 7) // YYYY-MM

        let matchesDate = true
        if (startDate) {
            matchesDate = matchesDate && budgetMonth >= startDate
        }
        if (endDate) {
            matchesDate = matchesDate && budgetMonth <= endDate
        }

        return matchesSearch && matchesDate
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage)
    const paginatedBudgets = filteredBudgets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handleDateChange = (setter: (value: string) => void, value: string) => {
        setter(value)
        setCurrentPage(1)
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1)
    }

    const isPending = createBudgetMutation.isPending || updateBudgetMutation.isPending

    return (
        <ProtectedRoute>
            <div className="p-4 lg:p-8 bg-white dark:bg-slate-900 min-h-screen flex flex-col">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Budget
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Track and manage your monthly budgets
                        </p>

                        {/* Search Bar - Similar to Expenses */}
                        <div className="relative mt-6">
                            <input
                                type="text"
                                placeholder="Search budget..."
                                className="md:w-[400px] h-[40px] px-4 py-2.5 pr-10 rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <div className="absolute inset-y-0 right-0 left-[360px] flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6 items-end">
                    {/* Date Filters: From - To */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                            From Month
                        </label>
                        <input
                            type="month"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-lavender-smoke dark:bg-slate-700 text-white dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                            value={startDate}
                            onChange={(e) => handleDateChange(setStartDate, e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                            To Month
                        </label>
                        <input
                            type="month"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-lavender-smoke dark:bg-slate-700 text-white dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                            value={endDate}
                            onChange={(e) => handleDateChange(setEndDate, e.target.value)}
                        />
                    </div>

                    {/* Add Button */}
                    <div className="md:col-start-5 md:col-span-2 flex justify-end gap-3">
                        <button
                            onClick={handleAddClick}
                            className="dark:bg-white dark:text-slate-900 text-white font-medium px-6 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Set Budget
                        </button>
                    </div>
                </div>

                {/* Form (Inline if Open) */}
                {isFormOpen && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                {editingId ? 'Edit Budget' : 'Set New Budget'}
                            </h3>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Month
                                </label>
                                <input
                                    type="month"
                                    required
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    disabled={!!editingId} // Usually keep disabled on edit to avoid conflicts
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-slate-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Budget Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white pl-7 pr-3 py-2 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2 text-sm font-medium text-white bg-green-grass hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? (
                                        <span className="animate-pulse">Saving...</span>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Budget
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-auto border rounded-xl max-h-[700px] relative">
                    <table className="w-full text-left border-collapse border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-white dark:bg-slate-800 shadow-sm">
                                <th className="py-4 px-4 text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700">Month</th>
                                <th className="py-4 px-4 text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700">Budget Amount</th>
                                <th className="py-4 px-4 text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-12 dark:border-slate-700">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading budgets...</p>
                                    </td>
                                </tr>
                            ) : paginatedBudgets.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 border-r border-slate-300 dark:border-slate-700">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Plus className="w-[100px] h-[100px] text-[#6A89A7]" />
                                            <h1 className="text-2xl font-semibold">No Budgets Found</h1>
                                            <p className="text-slate-500 dark:text-slate-400">Try adjusting filters or add a new budget</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {paginatedBudgets.map((budget: any, index: number) => (
                                        <tr
                                            key={budget.id}
                                            className={`hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-dove-blue dark:bg-slate-800/50'}`}
                                        >
                                            <td className="py-4 px-4 text-slate-900 dark:text-slate-100 border-r border-r-slate-300 dark:border-slate-700">
                                                {getFormattedMonth(budget.month)}
                                            </td>
                                            <td className="py-4 px-4 text-slate-900 dark:text-slate-100 border-r border-r-slate-300 dark:border-slate-700">
                                                ₱{Number(budget.budget_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-4 text-right border-r border-r-slate-300 dark:border-slate-700">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(budget)}
                                                        className="bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(budget.id)}
                                                        className="bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className='mt-auto'>
                    <PaginationFooter
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredBudgets.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
            </div>
        </ProtectedRoute>
    )
}
