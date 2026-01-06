"use client";

import MonthlyTrendChart from "@/components/MonthlyTrend";
import { AvgDailySpend } from "@/components/dashboard/AvgDailySpend";
import PaymentBreakdown from "@/components/PaymentBreakdown";
import WeeklySpendingChart from "@/components/WeeklySpending";
import { useCategoryBreakdown } from "@/hooks/useCategoryBreakdown";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrends";
import { useWeeklySpending } from "@/hooks/useWeeklySpending";
import { Wallet, CalendarDays, Clock, ListOrdered, AlertCircle } from "lucide-react";
import { usePaymentBreakdown } from "@/hooks/usePaymentMethods";
import { StatsCardSkeleton } from "@/components/skeletons/StatsCardSkeleton";
import { ChartSkeleton } from "@/components/skeletons/ChartSkeleton";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import RecentExpenses from "@/components/RecentExpenses";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { BudgetManager } from "@/components/BudgetManager";
import { RecurringExpenseList } from "@/components/RecurringExpenseList";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardPage() {
    const {
        data: stats,
        isLoading: statsLoading,
        isError: statsError,
    } = useDashboardStats();
    const { data: categoryData, isLoading: categoryLoading, isError: categoryError } =
        useCategoryBreakdown();
    const { data: weeklySpendingData, isLoading: weeklyLoading, isError: weeklyError } =
        useWeeklySpending();
    const { data: monthlyTrendData, isLoading: monthlyLoading, isError: monthlyError } =
        useMonthlyTrend();
    const { data: paymentData, isLoading: paymentLoading, isError: paymentError } =
        usePaymentBreakdown();

    return (
        <ProtectedRoute>
            <div className="p-4 lg:p-8">
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                        Dashboard
                    </h1>
                </div>

                {/* Section 1: Critical Stats (Alerts & Avg Spend) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    <div className="lg:col-span-9">
                        <BudgetAlerts />
                    </div>
                    <div className="lg:col-span-3">
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Analysis</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Spending metrics</p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <AvgDailySpend
                                    stats={stats}
                                    isLoading={statsLoading}
                                    isError={statsError}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Activity & Trends (Recent First on Mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    {/* Recent Expenses - Right on Desktop, Top on Mobile (Order 1) */}
                    <div className="lg:col-span-4 order-1 lg:order-2 space-y-6 lg:h-full">
                        {statsLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-20 bg-sky-mist dark:bg-slate-700 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : statsError ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    Failed to load recent expenses data
                                </p>
                            </div>
                        ) : (
                            <RecentExpenses recent_expenses={stats?.recent_expenses || []} />
                        )}
                    </div>

                    {/* Charts - Left on Desktop, Bottom on Mobile (Order 2) */}
                    <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                        {weeklyLoading ? (
                            <ChartSkeleton />
                        ) : weeklyError ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    Failed to load weekly spending data
                                </p>
                            </div>
                        ) : (
                            <WeeklySpendingChart data={weeklySpendingData?.data || []} />
                        )}

                        {monthlyLoading ? (
                            <ChartSkeleton />
                        ) : monthlyError ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    Failed to load monthly trend data
                                </p>
                            </div>
                        ) : (
                            <MonthlyTrendChart data={monthlyTrendData?.data || []} />
                        )}
                    </div>
                </div>

                {/* Section 3: Deep Dive Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-sky-mist dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                        <RecurringExpenseList />
                    </div>

                    {categoryLoading ? (
                        <div className="animate-pulse">
                            <div className="h-[300px] bg-sky-mist dark:bg-slate-700 rounded-full mx-auto w-[300px]"></div>
                        </div>
                    ) : categoryError ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                            <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                Failed to load category breakdown data
                            </p>
                        </div>
                    ) : (
                        <CategoryBreakdown data={categoryData?.data || []} />
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

