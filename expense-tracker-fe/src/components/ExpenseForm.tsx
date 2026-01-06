'use client'

import { useState } from 'react'
import { useCreateExpense } from '@/hooks/useExpenses'
import { useCategories, useCreateCategory } from '@/hooks/useCategories'
import type { CreateExpenseData } from '@/lib/types'

export default function ExpenseForm() {
    const createExpense = useCreateExpense()
    const { data: categories, isLoading: isLoadingCategories } = useCategories()
    const createCategory = useCreateCategory()

    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const [formData, setFormData] = useState<CreateExpenseData>({
        title: '',
        description: '',
        amount: 0,
        payment_method: 'CASH',
        date: new Date().toISOString().split('T')[0],
        category: undefined,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await createExpense.mutateAsync(formData)
            // Reset form
            setFormData({
                title: '',
                description: '',
                amount: 0,
                payment_method: 'CASH',
                date: new Date().toISOString().split('T')[0],
                category: undefined,
            })
            // Reset category creation state just in case
            setIsCreatingCategory(false)
            setNewCategoryName('')
        } catch (error) {
            console.error('Failed to create expense:', error)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
        }))
    }

    const handleCategoryChange = (value: string) => {
        if (value === 'new-category-option') {
            setIsCreatingCategory(true)
        } else {
            setFormData(prev => ({ ...prev, category: parseInt(value) }))
        }
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            const newCategory = await createCategory.mutateAsync({
                name: newCategoryName,
                description: 'Created from expense form',
                color: '#3b82f6' // Default blue
            })
            setFormData(prev => ({ ...prev, category: newCategory.id }))
            setIsCreatingCategory(false)
            setNewCategoryName('')
        } catch (error) {
            console.error('Failed to create category:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Title *
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    placeholder="Coffee, Groceries, etc."
                />
            </div>

            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Amount *
                </label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    placeholder="0.00"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                </label>
                {isCreatingCategory ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                            placeholder="New category name"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={createCategory.isPending || !newCategoryName.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                            {createCategory.isPending ? 'Adding...' : 'Add'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreatingCategory(false)
                                setNewCategoryName('')
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={formData.category || ''}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition appearance-none"
                        >
                            <option value="">Select a category...</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                            <option value="new-category-option" className="font-medium text-primary-600">
                                + Add new category
                            </option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date *
                </label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Optional notes..."
                />
            </div>

            <button
                type="submit"
                disabled={createExpense.isPending}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {createExpense.isPending ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                    </span>
                ) : (
                    'Add Expense'
                )}
            </button>

            {createExpense.isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                    Failed to add expense. Please try again.
                </div>
            )}
        </form>
    )
}
