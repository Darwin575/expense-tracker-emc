import { useState } from 'react'
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses'

type FrequencyKey = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function RecurringExpenseList() {
    const { data, isLoading } = useRecurringExpenses()
    const [openSections, setOpenSections] = useState<Record<FrequencyKey, boolean>>({
        daily: true,
        weekly: true,
        monthly: true,
        yearly: true
    });

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>

    const hasData = data && Object.values(data).some(arr => arr.length > 0);

    if (!hasData) return (
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No Recurring Expenses</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-4">
                Mark expenses as "Recurring" when adding them to see your daily, weekly, and monthly habits here.
            </p>
        </div>
    );

    const toggleSection = (section: FrequencyKey) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    }

    const sections: { key: FrequencyKey; label: string; bg: string; text: string; darkBg: string; darkText: string }[] = [
        { key: 'daily', label: 'Daily', bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400' },
        { key: 'weekly', label: 'Weekly', bg: 'bg-green-50', text: 'text-green-700', darkBg: 'dark:bg-green-900/20', darkText: 'dark:text-green-400' },
        { key: 'monthly', label: 'Monthly', bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400' },
        { key: 'yearly', label: 'Yearly', bg: 'bg-yellow-50', text: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/20', darkText: 'dark:text-yellow-400' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Recurring Expenses</h2>
            {sections.map(({ key, label, bg, text, darkBg, darkText }) => {
                const items = data[key] || [];
                if (items.length === 0) return null;

                return (
                    <div key={key} className="border dark:border-slate-800 rounded-lg overflow-hidden shadow-sm dark:bg-slate-900">
                        <button
                            onClick={() => toggleSection(key)}
                            className={`w-full flex items-center justify-between p-3 ${bg} ${darkBg} hover:opacity-90 transition-colors`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${text} ${darkText}`}>{label}</span>
                                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm border dark:border-slate-700">
                                    {items.length}
                                </span>
                            </div>
                            <span className={`${text} ${darkText}`}>
                                {openSections[key] ? '▼' : '▶'}
                            </span>
                        </button>

                        {openSections[key] && (
                            <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {items.map((item) => (
                                    <div key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.occurrences} occurrence{item.occurrences !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">₱{item.amount}</p>
                                            {item.category_name && (
                                                <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {item.category_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
