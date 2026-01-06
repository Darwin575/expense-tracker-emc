import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type DateFilterType } from "./types"


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// --- Helper Functions ---

// 1. Format date for display: YYYY-MM-DD -> MM/DD/YYYY
export function formatDate(dateString: string) {
    if (!dateString) return ''
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-')
    return `${month}/${day}/${year}`
}

// 2. Get local date string YYYY-MM-DD
export function toLocalISOString(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function getTodayDateString() {
    return toLocalISOString(new Date())
}

// 3. Calculate Date Range for Filter

export function getDateRange(filter: DateFilterType): [string | null, string | null] {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()

    switch (filter) {
        case 'ALL':
            return [null, null]

        case 'TODAY':
            const todayStr = toLocalISOString(today)
            return [todayStr, todayStr]

        case 'THIS_WEEK': {
            // Assuming Monday start
            const dayOfWeek = today.getDay() // 0 (Sun) - 6 (Sat)
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

            const startOfThisWeek = new Date(today)
            startOfThisWeek.setDate(today.getDate() + diffToMonday)

            const endOfThisWeek = new Date(startOfThisWeek)
            endOfThisWeek.setDate(startOfThisWeek.getDate() + 6)

            return [toLocalISOString(startOfThisWeek), toLocalISOString(endOfThisWeek)]
        }

        case 'LAST_WEEK': {
            const dayOfWeek = today.getDay()
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

            const startOfThisWeek = new Date(today)
            startOfThisWeek.setDate(today.getDate() + diffToMonday)

            const startOfLastWeek = new Date(startOfThisWeek)
            startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

            const endOfLastWeek = new Date(startOfLastWeek)
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)

            return [toLocalISOString(startOfLastWeek), toLocalISOString(endOfLastWeek)]
        }

        case 'THIS_MONTH': {
            const startOfMonth = new Date(currentYear, currentMonth, 1)
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0) // Last day of current month
            return [toLocalISOString(startOfMonth), toLocalISOString(endOfMonth)]
        }

        case 'LAST_MONTH': {
            const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
            const endOfLastMonth = new Date(currentYear, currentMonth, 0)
            return [toLocalISOString(startOfLastMonth), toLocalISOString(endOfLastMonth)]
        }

        case 'THIS_YEAR': {
            const startOfYear = new Date(currentYear, 0, 1)
            const endOfYear = new Date(currentYear, 11, 31)
            return [toLocalISOString(startOfYear), toLocalISOString(endOfYear)]
        }

        case 'LAST_YEAR': {
            const startOfLastYear = new Date(currentYear - 1, 0, 1)
            const endOfLastYear = new Date(currentYear - 1, 11, 31)
            return [toLocalISOString(startOfLastYear), toLocalISOString(endOfLastYear)]
        }

        default:
            return [null, null]
    }
}