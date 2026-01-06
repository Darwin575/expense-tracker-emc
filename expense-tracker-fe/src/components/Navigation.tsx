'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Receipt, Layers, LogOut, Settings, ArrowRightToLine, ArrowLeftToLine, Wallet, Tags } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import Image from "next/image";

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Expenses',
        href: '/expenses',
        icon: Receipt
    },
    {
        name: 'Budget',
        href: '/budget',
        icon: Wallet
    },
    {
        name: 'Categories',
        href: '/categories',
        icon: Tags
    }
]

interface NavigationProps {
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
}

export default function Navigation({ collapsed, setCollapsed }: NavigationProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, isLoading, isAuthenticated } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            window.location.href = '/auth/login'
        }
    }

    const isAuthPage = pathname?.startsWith('/auth')

    if (!mounted || isAuthPage) {
        return null
    }

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-64'}
                     bg-lavender-smoke dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                `}
            >




                <div className="flex flex-col h-full py-6">
                    {/* Logo */}
                    <div className="flex items-center mb-8 px-4 justify-center">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Image
                                src="/images/logo.jpeg"
                                alt="Logo"
                                width={120}
                                height={120}
                                className={collapsed ? 'size-12 rounded-full' : 'size-16 rounded-full'}
                            />
                        </Link>
                    </div>

                    <div className="px-3 mb-8 hidden sm:block">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-200
            text-white
            ${collapsed ? 'justify-center' : ''}
        `}
                            title={collapsed ? '' : 'Collapse sidebar'}
                        >
                            {collapsed ? <ArrowRightToLine size={20} /> : <ArrowLeftToLine size={20} />}
                            {!collapsed && <span className="text-sm font-medium">Collapse</span>}
                        </button>
                    </div>





                    {/* Navigation Links */}
                    <ul className="space-y-1 flex-1 px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                            ${isActive
                                                ? 'bg-storm-blue dark:bg-slate-800 text-white font-medium'
                                                : 'text-white dark:text-slate-400 hover:bg-storm-blue dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-slate-200'
                                            }
                                            ${collapsed ? 'justify-center' : ''}
                                        `}
                                        title={collapsed ? item.name : ''}
                                    >
                                        <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : ''}`} />
                                        {!collapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>

                    {/* Bottom Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 px-3">
                        {/* User Info */}
                        {user && (
                            <div className={`py-3 bg-slate-50 dark:bg-slate-800 rounded-lg ${collapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
                                {collapsed ? (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {user.username}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {user.email}
                                        </p>
                                        {user.is_staff && user.is_superuser && (
                                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                                Admin
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Admin Link */}
                        {user?.is_staff && user?.is_superuser && (
                            <Link
                                href="/admin"
                                className={`
      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
      ${pathname === '/admin'
                                        ? 'bg-storm-blue dark:bg-slate-800 text-white font-medium'
                                        : 'text-white dark:text-slate-400 hover:bg-storm-blue dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-slate-200'
                                    }
      ${collapsed ? 'justify-center' : ''}
    `}
                                title={collapsed ? 'Admin Panel' : ''}
                            >
                                <Settings
                                    size={20}
                                    className="shrink-0"
                                />
                                {!collapsed && (
                                    <span className="text-sm whitespace-nowrap">
                                        Admin Panel
                                    </span>
                                )}
                            </Link>
                        )}

                        <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between px-2'}`}>
                            {!collapsed && <span className="text-xs font-medium text-white dark:text-slate-400">Theme</span>}
                            <ThemeToggle />
                        </div>


                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? "Logout" : ""}
                        >
                            <LogOut size={20} className="shrink-0" />
                            {!collapsed && <span className="text-sm whitespace-nowrap">{isLoading ? 'Logging out...' : 'Logout'}</span>}
                        </button>

                        {!collapsed && (
                            <div className="px-2">
                                <p className="text-[10px] text-white dark:text-slate-600 text-center">
                                    v0.1.0 • Expense Manager
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}