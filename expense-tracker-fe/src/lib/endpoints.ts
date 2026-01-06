/**
 * Centralized API Endpoints
 * 
 * Usage:
 * import { ENDPOINTS } from '@/lib/endpoints'
 * 
 * apiService.get(ENDPOINTS.EXPENSES.LIST)
 */

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        LOGOUT: '/auth/logout/',
        ME: '/auth/me/',
        REQUEST_CREDENTIAL_RESET: '/auth/request-credential-reset/',
    },
    ADMIN: {
        USERS: '/auth/admin/users/',
        USER_DETAIL: (id: string | number) => `/auth/admin/users/${id}/`,
        USER_STATS: '/auth/admin/stats/',
        PROMOTE_USER: (id: string | number) => `/auth/admin/users/${id}/promote/`,
        DEMOTE_USER: (id: string | number) => `/auth/admin/users/${id}/demote/`,
        TOGGLE_ACTIVE: (id: string | number) => `/auth/admin/users/${id}/toggle-active/`,
        RESET_CREDENTIALS: (id: string | number) => `/auth/admin/users/${id}/reset-credentials/`,
    },
    EXPENSES: {
        LIST: '/expenses/',
        DETAIL: (id: string | number) => `/expenses/${id}/`,
        RECURRING: '/expenses/recurring/',
        EXPORT: '/export/',
    },
    BUDGETS: {
        LIST: '/budgets/',
        ALERTS: '/alerts/budget/',
        DETAIL: (id: string | number) => `/budgets/${id}/`,
    },
    CATEGORIES: {
        LIST: '/categories/',
        DETAIL: (id: string | number) => `/categories/${id}/`,
    },
    USERS: {
        LIST: '/users/',
        DETAIL: (id: string | number) => `/users/${id}/`,
    },
} as const
