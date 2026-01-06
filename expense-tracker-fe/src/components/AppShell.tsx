'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [collapsed, setCollapsed] = useState(false)
    const isAuthPage = pathname?.startsWith('/auth')

    // Auto-collapse on mobile/tablet on initial load and resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true)
            } else {
                setCollapsed(false)
            }
        }

        // Set initial state
        handleResize()

        // Listen to resize
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Auth protection for successful user experience (no flash of content)
    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isAuthPage) {
            router.push('/auth/login')
        }
    }, [isLoading, isAuthenticated, isAuthPage, router])

    if (isAuthPage) {
        return <main className="min-h-screen">{children}</main>
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-slate-100 rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading Expense Manager...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
            <Navigation collapsed={collapsed} setCollapsed={setCollapsed} />
            <main
                className={`
                    h-full overflow-y-auto transition-all duration-300 ease-in-out
                    ${collapsed ? 'pl-20' : 'pl-64'}
                `}
            >
                {/* Add a container for content to ensure spacing is consistent */}
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
