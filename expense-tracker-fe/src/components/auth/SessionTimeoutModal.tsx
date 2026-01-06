'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth-service'

interface SessionTimeoutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SessionTimeoutModal({ isOpen, onClose }: SessionTimeoutModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    const handleLogin = () => {
        onClose()
        router.push('/auth/login')
    }

    const handleLogout = async () => {
        await authService.logout()
        onClose()
        router.push('/auth/login')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-6 h-6 text-yellow-600 dark:text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Session Expired
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Your session has expired. Please log in again to continue.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLogin}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Log In Again
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    )
}
