'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/Toast'
import { SessionTimeoutModal } from '@/components/auth/SessionTimeoutModal'
import { authService } from '@/lib/auth-service'

function SessionWrapper({ children }: { children: React.ReactNode }) {
    const [isSessionExpired, setIsSessionExpired] = useState(false)

    useEffect(() => {
        return authService.onSessionExpired(() => {
            setIsSessionExpired(true)
        })
    }, [])

    return (
        <>
            {children}
            <SessionTimeoutModal
                isOpen={isSessionExpired}
                onClose={() => setIsSessionExpired(false)}
            />
        </>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <AuthProvider>
                    <SessionWrapper>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </SessionWrapper>
                </AuthProvider>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
