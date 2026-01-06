import { useState } from 'react'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudget'
import { Plus, Trash2, Edit2, X, Check, Save } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export function BudgetManager() {
    const { data: budgets, isLoading } = useBudgets()
    const createBudgetMutation = useCreateBudget()
    const updateBudgetMutation = useUpdateBudget()
    const deleteBudget = useDeleteBudget()

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [month, setMonth] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState<string | null>(null)

    if (isLoading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>

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

    // New handleEdit function from the provided snippet
    const handleEditClick = (budget: any) => {
        setEditingId(budget.id)
        // budget.month is likely YYYY-MM-DD or YYYY-MM from backend. 
        // Input type="month" expects YYYY-MM. 
        // If backend returns YYYY-MM-DD, we might need to slice it.
        // Based on previous file, it seemed to be displaying just YYYY-MM or similar.
        // We'll assume budget.month is YYYY-MM format or we extract it.
        // If it comes as full date, we take first 7 chars.
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

        // Append -01 to satisfy backend DateField if just YYYY-MM
        const formattedMonth = month.length === 7 ? `${month}-01` : month

        const mutationOptions = {
            onSuccess: resetForm,
            onError: (err: any) => {
                // Try to extract a meaningful error message from the backend response
                const responseData = err.response?.data
                if (responseData) {
                    if (typeof responseData === 'object') {
                        // Handle DRF standard error format { field: [errors], non_field_errors: [errors] }
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
                setError('Failed to save budget. Please check your input and try again.')
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
    // New handleDelete function from the provided snippet
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this budget?')) {
            deleteBudget.mutate(id)
        }
    }

    const isPending = createBudgetMutation.isPending || updateBudgetMutation.isPending

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Monthly Budgets</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your monthly spending limits</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Budget
                    </button>
                )}
            </div>
            {/* Inline Form */}
            {isFormOpen && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-lg p-6 animate-in fade-in slide-in-from-top-4 duration-200">
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
                                disabled={!!editingId} // Disable month editing if updating, or allow? Usually budget keys are unique. Let's keep it enabled? 
                                // Actually usually unique together (user, month). If we change month, it might conflict. 
                                // The previous code disabled it on edit. I will follow that pattern for safety.
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-800"
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
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-600/20"
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

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Month</th>
                            <th className="px-6 py-3 font-semibold">Budget Amount</th>
                            <th className="px-6 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {Array.isArray(budgets) && budgets.map((budget) => (
                            <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {/* {budget.month} */}
                                    {format(parseISO(budget.month), 'MMMM yyyy')}
                                </td>
                                <td className="px-6 py-4 text-gray-900 dark:text-white">
                                    ₱{Number(budget.budget_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEditClick(budget)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                            title="Edit Budget"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            title="Delete Budget"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {budgets?.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full mb-3">
                                            <Plus className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white mb-1">No Budgets Found</p>
                                        <p className="text-sm text-gray-400 mb-4 max-w-xs">Start taking control of your finances by setting a monthly budget.</p>
                                        <button
                                            onClick={handleAddClick}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm hover:underline"
                                        >
                                            Create your first budget
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
