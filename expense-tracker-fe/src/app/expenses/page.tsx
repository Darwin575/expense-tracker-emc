'use client'

import { useState, useMemo } from 'react'
import { useExpenses, useCreateExpense, useDeleteExpense, useUpdateExpense } from '@/hooks/useExpenses'
import { useCategories, useCreateCategory } from '@/hooks/useCategories'
import type { CreateExpenseData, DateFilterType } from '@/lib/types'
import Modal from '@/components/Modal'
import ExportModal from '@/components/ExportModal'
import { formatDate, toLocalISOString, getTodayDateString, getDateRange } from '@/lib/utils'
import { PaginationFooter } from "@/components/paginationfooter";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from '@/components/confirmDialog'
import { ProtectedRoute } from "@/components/ProtectedRoute"




export default function ExpensesPage() {
    const { data: expenses, isLoading } = useExpenses()
    const { data: categories } = useCategories()
    const createExpense = useCreateExpense()
    const deleteExpense = useDeleteExpense()
    const updateExpense = useUpdateExpense()
    const createCategory = useCreateCategory()
    const { showToast } = useToast()

    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    const [isAppModalOpen, setIsAppModalOpen] = useState(false)
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount' | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })
    const [editingId, setEditingId] = useState<number | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [formData, setFormData] = useState<Omit<CreateExpenseData, 'amount'> & { amount: string | number }>({
        title: '',
        description: '',
        amount: '',
        payment_method: 'CASH',
        date: getTodayDateString(),
    })
    const [errors, setErrors] = useState<{ amount?: string; date?: string }>({})

    // Autocomplete Data
    const uniqueTitles = useMemo(() => {
        if (!expenses) return []
        const list = Array.isArray(expenses) ? expenses : (expenses as any).results || []
        return Array.from(new Set(list.map((e: any) => e.title))).sort() as string[]
    }, [expenses])

    const uniqueDescriptions = useMemo(() => {
        if (!expenses) return []
        const list = Array.isArray(expenses) ? expenses : (expenses as any).results || []
        return Array.from(new Set(list.map((e: any) => e.description).filter(Boolean))).sort() as string[]
    }, [expenses])

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            amount: '',
            payment_method: 'CASH',
            date: getTodayDateString(),
            category: undefined,
        })
        setErrors({})
        setEditingId(null)
        setIsCreatingCategory(false)
        setNewCategoryName('')
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            const newCategory = await createCategory.mutateAsync({
                name: newCategoryName,
                description: 'Created from expense page',
                color: '#3b82f6' // Default blue
            })
            setFormData(prev => ({ ...prev, category: newCategory.id }))
            setIsCreatingCategory(false)
            setNewCategoryName('')
            showToast('Category created successfully', 'success')
        } catch (error) {
            console.error('Failed to create category:', error)
            showToast('Failed to create category', 'error')
        }
    }

    const handleOpenAddModal = () => {
        resetForm()
        setIsAppModalOpen(true)
    }

    const handleEdit = (expense: any) => {
        // Populate form with expense data
        // Note: expense.amount is a string in mockData/types usually, careful with parsing
        // In the hook types, 'amount' is string in Expense but number in CreateExpenseData
        // We need to match CreateExpenseData structure

        setFormData({
            title: expense.title,
            description: expense.description || '',
            amount: parseFloat(expense.amount),
            payment_method: expense.payment_method,
            category: expense.category || undefined,
            date: expense.date.split('T')[0], // Ensure just the date part
        })
        setEditingId(expense.id)
        setIsAppModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const newErrors: { amount?: string; date?: string } = {}
        const amountValue = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount

        if (!amountValue || amountValue <= 0) {
            newErrors.amount = 'Amount must be greater than 0'
        }
        if (!formData.date) {
            newErrors.date = 'Date is required'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            const selectedCategory = categories?.find(c => c.id === formData.category);
            const submissionData = {
                ...formData,
                amount: amountValue as number,
                // title: selectedCategory ? selectedCategory.name : 'Expense', // REMOVED: Allow user entered title
                payment_method: 'CASH' as const
            };

            if (editingId) {
                // Update
                await updateExpense.mutateAsync({
                    id: editingId,
                    ...submissionData,
                    amount: submissionData.amount.toString()
                })
                showToast('Expense updated successfully', 'success')
            } else {
                // Create
                await createExpense.mutateAsync(submissionData)
                showToast('Expense added successfully', 'success')
            }

            resetForm()
            setIsAppModalOpen(false)
        } catch (error: any) {
            console.error('Failed to save expense:', error)
            const message = error?.response?.data?.message || error.message || 'Failed to save expense';
            showToast(message, 'error')
        }
    }

    const handleDelete = (id: number) => {
        setDeleteId(id)
        setIsDeleteConfirmOpen(true)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteExpense.mutate(deleteId, {
                onSuccess: () => {
                    showToast('Expense deleted successfully', 'success')
                },
                onError: (error: any) => {
                    const message = error?.response?.data?.message || error.message || 'Failed to delete expense';
                    showToast(message, 'error')
                }
            })
            setIsDeleteConfirmOpen(false)
            setDeleteId(null)
        }
    }



    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'amount' ? value : name === 'category' ? (value ? parseInt(value) : undefined) : value,
        }))
        // Clear error for the field being edited
        if (name === 'amount' || name === 'date') {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
    }

    // Filter Logic
    const expenseList = Array.isArray(expenses)
        ? expenses
        : (expenses as any)?.results ?? [];
    const filteredExpenses = expenseList?.filter((expense: any) => {
        // Split search query by spaces to handle multiple terms
        const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/);

        const lowerDescription = (expense.description?.toLowerCase() ?? '');
        const lowerTitle = (expense.title?.toLowerCase() ?? '');
        const lowerAmount = (expense.amount.toString() ?? '');
        const lowerDate = (expense.date ?? '');
        const lowerCategoryName = (expense.category_name?.toLowerCase() ?? '');

        // Check if ALL terms match at least one field
        const matchesSearch = searchTerms.every(term =>
            lowerDescription.includes(term) ||
            lowerTitle.includes(term) ||
            lowerAmount.includes(term) ||
            lowerDate.includes(term) ||
            lowerCategoryName.includes(term)
        );

        // Date Range Logic
        const expenseDatePart = expense.date.split('T')[0];
        const [startDate, endDate] = getDateRange(dateFilter);

        let matchesDate = true;
        if (startDate && endDate) {
            matchesDate = expenseDatePart >= startDate && expenseDatePart <= endDate;
        }

        const matchesCategory = categoryFilter ? expense.category === parseInt(categoryFilter) : true;

        return matchesSearch && matchesDate && matchesCategory;
    })

    const sortedExpenses = [...(filteredExpenses || [])].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let comparison = 0;
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            comparison = dateA - dateB;
        } else if (sortConfig.key === 'amount') {
            const amountA = parseFloat(a.amount);
            const amountB = parseFloat(b.amount);
            comparison = amountA - amountB;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage)
    const paginatedExpenses = sortedExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset to page 1 when filters change
    const handleFilterChange = (setter: (value: any) => void, value: any) => {
        setter(value)
        setCurrentPage(1)
    }

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1) // Reset to first page when changing items per page
    }

    const requestSort = (key: 'date' | 'amount') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }

    const getSortIcon = (key: 'date' | 'amount') => {
        if (sortConfig.key !== key) {
            return (
                <svg className="w-4 h-4 ml-1 text-slate-400 opacity-0 group-hover:opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            )
        }
        if (sortConfig.direction === 'asc') {
            return (
                <svg className="w-4 h-4 ml-1 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            )
        }
        return (
            <svg className="w-4 h-4 ml-1 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        )
    }

    return (
        <ProtectedRoute>
            <div className="p-4 lg:p-8 bg-white dark:bg-slate-900 min-h-screen flex flex-col">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Expenses
                        </h1>
                    </div>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search"
                        className="md:w-[400px] md:h-[40px] pl-10 pr-10 py-2.5 rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none md:right-auto md:left-[365px]">
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Filters */}


                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6 items-end">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                            Date
                        </label>
                        <select
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-lavender-smoke dark:bg-slate-700 text-white dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                        >
                            <option value="ALL">All Dates</option>
                            <option value="TODAY">Today</option>
                            <option value="THIS_WEEK">This Week</option>
                            <option value="LAST_WEEK">Last Week</option>
                            <option value="THIS_MONTH">This Month</option>
                            <option value="LAST_MONTH">Last Month</option>
                            <option value="THIS_YEAR">This Year</option>
                            <option value="LAST_YEAR">Last Year</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                            Category
                        </label>
                        <select
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-[#6a89a7] dark:bg-slate-700 text-white dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions (right aligned, no width changes) */}
                    <div className="md:col-start-5 md:col-span-2 flex justify-end gap-3 flex-wrap">

                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                />
                            </svg>
                            Export
                        </button>

                        <button
                            onClick={handleOpenAddModal}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            Add Expenses
                        </button>
                    </div>
                </div>



                {/* Expenses */}
                {/* <div className=" dark:bg-slate-900 rounded-2xl p-6 flex-1 flex flex-col"> */}
                {/* <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
                    All Expenses ({sortedExpenses?.length || 0})
                </h2> */}

                {/* Expense List */
                    sortedExpenses && (
                        <>
                            {/* Mobile Card Layout */}
                            <div className="md:hidden space-y-3">
                                {isLoading ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading expenses...</p>
                                    </div>
                                ) : paginatedExpenses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                        <h1 className="text-2xl font-semibold">No Expenses Found</h1>
                                        <p className="text-slate-500 dark:text-slate-400">Try adding an expense by clicking add expense</p>
                                    </div>
                                ) : (
                                    paginatedExpenses.map((expense) => {
                                        const categoryColor = categories?.find(c => c.id === expense.category)?.color_code || '#6b7280';
                                        return (
                                            <div
                                                key={expense.id}
                                                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                            {expense.title}
                                                        </h3>
                                                        {expense.description && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                {expense.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xl font-bold text-slate-900 dark:text-white ml-3">
                                                        ₱{parseFloat(expense.amount).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    {expense.category_name && (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-300">
                                                            {expense.category_name}
                                                            <span
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: categoryColor }}
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {formatDate(expense.date)}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="flex-1 bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        disabled={deleteExpense.isPending}
                                                        className="flex-1 bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {/* Mobile Card Layout */}
                            <div className="md:hidden space-y-3">
                                {isLoading ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading expenses...</p>
                                    </div>
                                ) : paginatedExpenses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                        <h1 className="text-2xl font-semibold">No Expenses Found</h1>
                                        <p className="text-slate-500 dark:text-slate-400">Try adding an expense by clicking add expense</p>
                                    </div>
                                ) : (
                                    paginatedExpenses.map((expense) => {
                                        const categoryColor = categories?.find(c => c.id === expense.category)?.color_code || '#6b7280';
                                        return (
                                            <div
                                                key={expense.id}
                                                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                            {expense.title}
                                                        </h3>
                                                        {expense.description && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                {expense.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-xl font-bold text-slate-900 dark:text-white ml-3">
                                                        ₱{parseFloat(expense.amount).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    {expense.category_name && (
                                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-300">
                                                            {expense.category_name}
                                                            <span
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: categoryColor }}
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {formatDate(expense.date)}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="flex-1 bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        disabled={deleteExpense.isPending}
                                                        className="flex-1 bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Tablet/Desktop Table Layout */}
                            <div className="hidden md:block overflow-x-auto border rounded-xl">
                                <table className="w-full min-w-[640px] text-left border-collapse border dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
                                    {(paginatedExpenses.length > 0) && (
                                        <thead>
                                            <tr className="bg-white dark:bg-slate-800">
                                                <th className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700">Name</th>
                                                <th className="hidden lg:table-cell py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700">Description</th>
                                                <th className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700">Category</th>
                                                <th
                                                    className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700 cursor-pointer group hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                                                    onClick={() => requestSort('amount')}
                                                >
                                                    <div className="flex items-center">
                                                        Amount
                                                        {getSortIcon('amount')}
                                                    </div>
                                                </th>
                                                <th
                                                    className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700 cursor-pointer group hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                                                    onClick={() => requestSort('date')}
                                                >
                                                    <div className="flex items-center">
                                                        Date
                                                        {getSortIcon('date')}
                                                    </div>
                                                </th>
                                                <th className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-lg font-large text-slate-500 dark:text-slate-400 border dark:border-slate-700 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                    )}
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12  dark:border-slate-700">
                                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading expenses...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedExpenses.length === 0 ? (
                                            <td colSpan={4} className="py-12 border-r border-slate-300 dark:border-slate-700">
                                                <div className=" flex flex-col items-center justify-center gap-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                                    <h1 className="text-2xl font-semibold text-4xl">No Expenses Found</h1>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xl">Try adding an expense by clicking add expense</p>
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                {paginatedExpenses.map((expense, index) => (
                                                    <tr
                                                        key={expense.id}
                                                        className={`hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-dove-blue dark:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <td className="truncate max-w-[100px] md:max-w-[150px] w-24 md:w-36 overflow-hidden whitespace-nowrap py-3 md:py-4 px-2 md:px-4 text-slate-900 dark:text-slate-100 text-xs md:text-sm font-medium border-r border-r-slate-300 dark:border-slate-700">
                                                            {expense.title}
                                                        </td>
                                                        <td className="hidden lg:table-cell truncate max-w-[200px] w-64 overflow-hidden whitespace-nowrap py-3 md:py-4 px-2 md:px-4 text-slate-600 dark:text-slate-400 text-xs md:text-sm border-r border-r-slate-300 dark:border-slate-700">
                                                            {expense.description || '-'}
                                                        </td>
                                                        <td className="hidden md:table-cell w-32 md:w-40 py-3 md:py-4 px-2 md:px-4 border-r border-r-slate-300 dark:border-slate-700">
                                                            {expense.category_name && (() => {
                                                                const categoryColor = categories?.find(c => c.id === expense.category)?.color_code || '#6b7280';
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300">
                                                                        <span className="truncate max-w-[80px]">{expense.category_name}</span>
                                                                        <span
                                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: categoryColor }}
                                                                        />
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="w-20 md:w-28 py-3 md:py-4 px-2 md:px-4 text-right font-medium text-xs md:text-sm dark:text-white border-r border-r-slate-300 dark:border-slate-700">
                                                            <span className="hidden sm:inline">₱</span>{parseFloat(expense.amount).toFixed(2)}
                                                        </td>
                                                        <td className="w-24 md:w-36 truncate overflow-hidden whitespace-nowrap py-3 md:py-4 px-2 md:px-4 text-slate-900 dark:text-slate-100 text-xs md:text-sm border-r border-r-slate-300 dark:border-slate-700">
                                                            {formatDate(expense.date)}
                                                        </td>
                                                        <td className="w-32 md:w-44 py-3 md:py-4 px-2 md:px-4 text-right border-r border-r-slate-300 dark:border-slate-700">
                                                            <div className="flex flex-col md:flex-row justify-end gap-1 md:gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(expense)}
                                                                    className="bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-2 md:px-4 py-1 md:py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors text-xs md:text-sm"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(expense.id)}
                                                                    disabled={deleteExpense.isPending}
                                                                    className="bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-2 md:px-4 py-1 md:py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors text-xs md:text-sm"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Empty placeholder rows */}
                                                {Array.from({ length: Math.max(0, itemsPerPage - paginatedExpenses.length) }).map((_, index) => (
                                                    <tr
                                                        key={`empty-${index}`}
                                                        className={`${(paginatedExpenses.length + index) % 2 === 0
                                                            ? 'bg-white dark:bg-slate-900'
                                                            : 'bg-dove-blue dark:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <td className="py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                        <td className="hidden lg:table-cell py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                        <td className="py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                        <td className="py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                        <td className="py-3 md:py-4 px-2 md:px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                {/* Pagination Controls */}
                <div className='mt-auto'>
                    <PaginationFooter
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedExpenses.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
                <Modal
                    isOpen={isAppModalOpen}
                    onClose={() => setIsConfirmCancelOpen(true)}
                    title={editingId ? 'Edit Expense' : 'New Expense'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    list="title-suggestions"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition pr-10"
                                    placeholder="Expense Name"
                                />
                                <datalist id="title-suggestions">
                                    {uniqueTitles.map((title) => (
                                        <option key={title} value={title} />
                                    ))}
                                </datalist>
                                <datalist id="title-suggestions">
                                    {uniqueTitles.map((title) => (
                                        <option key={title} value={title} />
                                    ))}
                                </datalist>
                                {formData.title && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition resize-none"
                                placeholder="Optional notes..."
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                                Category
                            </label>
                            {isCreatingCategory ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                                        placeholder="New category name"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateCategory}
                                        disabled={createCategory.isPending || !newCategoryName.trim()}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 text-sm font-medium transition-colors"
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
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dropdown = document.getElementById('category-dropdown');
                                            if (dropdown) dropdown.classList.toggle('hidden');
                                        }}
                                        className="w-full px-4 py-2.5 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition text-left flex items-center justify-between"
                                    >
                                        <span>
                                            {formData.category
                                                ? `${categories?.find(c => c.id === Number(formData.category))?.icon || ''} ${categories?.find(c => c.id === Number(formData.category))?.name || 'Select category'}`
                                                : 'Select category'}
                                        </span>
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {/* Color indicator circle for selected */}
                                    <span
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 pointer-events-none"
                                        style={{
                                            backgroundColor: formData.category
                                                ? categories?.find(c => c.id === Number(formData.category))?.color_code || '#6b7280'
                                                : 'transparent'
                                        }}
                                    />
                                    {/* Dropdown menu */}
                                    <div
                                        id="category-dropdown"
                                        className="hidden absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                    >
                                        <div
                                            className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-3"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, category: undefined }));
                                                document.getElementById('category-dropdown')?.classList.add('hidden');
                                            }}
                                        >
                                            <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 bg-transparent" />
                                            <span className="text-slate-900 dark:text-slate-100">Select category</span>
                                        </div>
                                        {categories?.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-3"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, category: cat.id }));
                                                    document.getElementById('category-dropdown')?.classList.add('hidden');
                                                }}
                                            >
                                                <span
                                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: cat.color_code || '#6b7280' }}
                                                />
                                                <span className="text-slate-900 dark:text-slate-100">{cat.icon} {cat.name}</span>
                                            </div>
                                        ))}
                                        <div
                                            className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-3 border-t border-slate-200 dark:border-slate-600"
                                            onClick={() => {
                                                setIsCreatingCategory(true);
                                                document.getElementById('category-dropdown')?.classList.add('hidden');
                                            }}
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center text-slate-600 dark:text-slate-400">+</span>
                                            <span className="text-primary-600 dark:text-primary-400 font-medium">Add new category</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.category || ''}
                                        // required // Removed required to allow optional category logic if needed, but form validation handles it
                                        className="absolute top-8 opacity-0 pointer-events-none"
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                                Amount (PHP) <span className="text-red-500">*</span>
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
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.amount ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition pr-10`}
                                placeholder="0.00"
                            />
                            {Number(formData.amount) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, amount: '' }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                            {errors.amount && (
                                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.date ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition`}
                            />
                            {errors.date && (
                                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                            )}
                        </div>

                        <div className="pt-2 flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className=" bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createExpense.isPending || updateExpense.isPending}
                                className="bg-green-grass dark:bg-white text-white dark:text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-lime-700 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createExpense.isPending || updateExpense.isPending ? 'Saving...' : (editingId ? 'Update Expense' : 'Save Expense')}
                            </button>
                        </div>
                    </form>
                </Modal>

                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    categories={categories}
                />

                <ConfirmDialog
                    open={isConfirmCancelOpen}
                    onOpenChange={setIsConfirmCancelOpen}
                    title="Confirm Cancellation"
                    description="Are you sure you want to cancel? Your changes won't be saved."
                    cancelLabel="Keep editing"
                    confirmLabel="Cancel"
                    onConfirm={() => {
                        setIsConfirmCancelOpen(false)
                        setIsAppModalOpen(false)
                        resetForm()
                    }}
                    confirmButtonClass="bg-red-600 text-white hover:bg-red-700"
                />

                <ConfirmDialog
                    open={isDeleteConfirmOpen}
                    onOpenChange={setIsDeleteConfirmOpen}
                    title="Delete Expense"
                    description="Are you sure you want to delete this expense? This action cannot be undone."
                    cancelLabel="Cancel"
                    confirmLabel="Delete"
                    onConfirm={confirmDelete}
                    confirmButtonClass="bg-[#D90000] dark:bg-[#D90000]/80 text-white hover:bg-[#D90000]/90"
                />
            </div>
        </ProtectedRoute>
    )
}
