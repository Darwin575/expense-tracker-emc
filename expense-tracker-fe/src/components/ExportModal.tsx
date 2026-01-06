'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { ENDPOINTS } from '@/lib/endpoints'
import apiClient from '@/lib/api'
import { useToast } from './Toast'

interface Category {
    id: number
    name: string
}

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    categories?: Category[]
}

type ExportFormat = 'csv' | 'xlsx' | 'pdf'
type PaymentMethod = '' | 'CASH' | 'CARD'

interface ExportFormData {
    export_format: ExportFormat
    start_date: string
    end_date: string
    category: string
    payment_method: PaymentMethod
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
}

// Helper to get the first day of current month
const getFirstDayOfMonth = () => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
}

export default function ExportModal({ isOpen, onClose, categories = [] }: ExportModalProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { showToast } = useToast()

    const [formData, setFormData] = useState<ExportFormData>({
        export_format: 'csv',
        start_date: '',
        end_date: '',
        category: '',
        payment_method: '',
    })

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                export_format: 'csv',
                start_date: '',
                end_date: '',
                category: '',
                payment_method: '',
            })
            setError(null)
        }
    }, [isOpen])

    // Auto-set end_date to today when start_date is selected and end_date is empty
    useEffect(() => {
        if (formData.start_date && !formData.end_date) {
            setFormData(prev => ({ ...prev, end_date: getTodayDate() }))
        }
    }, [formData.start_date])

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError(null) // Clear error when user makes changes
    }

    // Quick date range presets
    const setDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'all') => {
        const today = new Date()

        switch (preset) {
            case 'today':
                const todayStr = getTodayDate()
                setFormData(prev => ({ ...prev, start_date: todayStr, end_date: todayStr }))
                break
            case 'this_week':
                const dayOfWeek = today.getDay()
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - dayOfWeek)
                setFormData(prev => ({
                    ...prev,
                    start_date: startOfWeek.toISOString().split('T')[0],
                    end_date: getTodayDate()
                }))
                break
            case 'this_month':
                setFormData(prev => ({
                    ...prev,
                    start_date: getFirstDayOfMonth(),
                    end_date: getTodayDate()
                }))
                break
            case 'all':
                setFormData(prev => ({ ...prev, start_date: '', end_date: '' }))
                break
        }
    }

    // Validate dates
    const validateDates = (): boolean => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date)
            const end = new Date(formData.end_date)
            if (start > end) {
                setError('Start date cannot be after end date')
                return false
            }
        }
        return true
    }

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate dates before export
        if (!validateDates()) {
            return
        }

        setIsExporting(true)

        try {
            // Get auth token from sessionStorage
            const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null

            if (!token) {
                setError('You must be logged in to export expenses')
                showToast('Please log in to export expenses', 'error')
                setIsExporting(false)
                return
            }

            // Build query params
            const params = new URLSearchParams()
            params.append('export_format', formData.export_format)

            if (formData.start_date) {
                params.append('start_date', formData.start_date)
            }
            // If start_date is set but end_date is not, it will default to today on backend
            if (formData.end_date) {
                params.append('end_date', formData.end_date)
            }
            if (formData.category) {
                params.append('category', formData.category)
            }
            if (formData.payment_method) {
                params.append('payment_method', formData.payment_method)
            }

            // Use apiClient for the request to ensure tokens are attached and errors handled
            const response = await apiClient.get(ENDPOINTS.EXPENSES.EXPORT, {
                params: params,
                responseType: 'blob',
            })

            // Get filename from Content-Disposition header or generate one
            const contentDisposition = response.headers['content-disposition']
            let filename = `expenses_export.${formData.export_format}`
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            // Create blob and download
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            // Show success message
            showToast(`Expenses exported successfully as ${formData.export_format.toUpperCase()}`, 'success')

            // Close modal on success
            onClose()

            // Reset form
            setFormData({
                export_format: 'csv',
                start_date: '',
                end_date: '',
                category: '',
                payment_method: '',
            })
        } catch (error) {
            console.error('Export failed:', error)
            // Error is already handled by interceptor (e.g. 401), but we can show a generic alert for others
            // Only alert if it's NOT a 401 (as that will show the modal)
            // @ts-ignore
            if (error?.response?.status !== 401) {
                alert('Failed to export expenses. Please try again.')
            }
        } finally {
            setIsExporting(false)
        }
    }

    const formatIcons: Record<ExportFormat, JSX.Element> = {
        csv: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        xlsx: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
        pdf: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    }

    const formatDescriptions: Record<ExportFormat, string> = {
        csv: 'Simple spreadsheet format',
        xlsx: 'Excel with formatting',
        pdf: 'Print-ready document',
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Expenses">
            <form onSubmit={handleExport} className="space-y-5">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* Export Format */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Export Format <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['csv', 'xlsx', 'pdf'] as ExportFormat[]).map((format) => (
                            <button
                                key={format}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, export_format: format }))}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${formData.export_format === format
                                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {formatIcons[format]}
                                <span className="mt-2 text-sm font-medium uppercase">{format}</span>
                                <span className={`text-xs mt-1 ${formData.export_format === format ? 'opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {formatDescriptions[format]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Date Presets */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Quick Select Date Range
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Today', value: 'today' as const },
                            { label: 'This Week', value: 'this_week' as const },
                            { label: 'This Month', value: 'this_month' as const },
                            { label: 'All Time', value: 'all' as const },
                        ].map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setDatePreset(preset.value)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            max={formData.end_date || getTodayDate()}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            End Date
                            {formData.start_date && !formData.end_date && (
                                <span className="text-xs text-slate-400 ml-1">(defaults to today)</span>
                            )}
                        </label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            min={formData.start_date}
                            max={getTodayDate()}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Category <span className="text-xs text-slate-400">(optional)</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Payment Method */}
                {/* <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Payment Method <span className="text-xs text-slate-400">(optional)</span>
                    </label>
                    <select
                        id="payment_method"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                    >
                        <option value="">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                    </select>
                </div> */}

                {/* Info Note */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">SpendWise Export Tips:</p>
                            <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                                <li>Only file format is required, all filters are optional</li>
                                <li>Leave date fields empty to export all expenses</li>
                                <li>If you set a start date, end date defaults to today</li>
                                <li>The export includes a summary with totals and timestamps</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isExporting}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-3 px-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isExporting}
                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isExporting ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export {formData.export_format.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

