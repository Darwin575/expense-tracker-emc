import { useBudgetAlerts } from '@/hooks/useBudget'
import { AlertCircle, CheckCircle, Info, AlertTriangle, Wallet } from 'lucide-react';

export function BudgetAlerts() {
    const { data, isLoading } = useBudgetAlerts()

    if (isLoading) return <div className="animate-pulse h-48 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>

    // Empty/Initial State
    if (!data || Object.values(data).every(d => d.budget === 0)) return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full mb-3">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-1">No Budgets Set</h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm max-w-md">
                Set a monthly budget to track your spending limits here.
            </p>
        </div>
    );

    const periods = [
        { key: 'day', label: 'Today', data: data.day },
        { key: 'week', label: 'This Week', data: data.week },
        { key: 'month', label: 'This Month', data: data.month },
        { key: 'year', label: 'This Year', data: data.year },
    ] as const;

    const getSeverity = (percent: number) => {
        if (percent > 100) return {
            color: 'bg-red-500 dark:bg-red-600',
            text: 'text-red-700 dark:text-red-400',
            label: 'Exceeded',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            icon: AlertCircle,
            desc: 'Over Budget Limit'
        };
        if (percent >= 90) return {
            color: 'bg-orange-500 dark:bg-orange-600',
            text: 'text-orange-700 dark:text-orange-400',
            label: 'Critical',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
            icon: AlertTriangle,
            desc: 'Near Budget Limit'
        };
        if (percent >= 75) return {
            color: 'bg-yellow-500 dark:bg-yellow-600',
            text: 'text-yellow-700 dark:text-yellow-400',
            label: 'Warning',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            icon: Info,
            desc: 'Approaching Limit'
        };
        return {
            color: 'bg-green-500 dark:bg-green-600',
            text: 'text-green-700 dark:text-green-400',
            label: 'Safe',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            icon: CheckCircle,
            desc: 'Within Budget'
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Budget Alerts</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Track your spending against your limits</p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {periods.map(({ key, label, data: usage }) => {
                    if (!usage) return null; // Safety check
                    const { color, text, label: statusLabel, bg, border, icon: Icon, desc } = getSeverity(usage.percentage_consumed);

                    return (
                        <div key={key} className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between ${bg} ${border} border-opacity-50 dark:border-opacity-50 transition-transform hover:scale-[1.01]`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                                <div className="group relative">
                                    <Icon className={`w-5 h-5 ${text} cursor-help`} />
                                    {/* Simple Tooltip */}
                                    <span className="absolute right-0 top-6 w-32 bg-gray-800 dark:bg-gray-700 text-white text-xs p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        {desc}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₱{usage.expense}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">of ₱{usage.budget}</span>
                                </div>

                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
                                        style={{ width: `${Math.min(usage.percentage_consumed, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className={text}>{statusLabel}</span>
                                    <span className="text-gray-600 dark:text-gray-300">{usage.percentage_consumed}% Used</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
