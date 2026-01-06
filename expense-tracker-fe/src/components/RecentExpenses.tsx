import { Expense } from "@/lib/types";

interface RecentExpensesProps {
    recent_expenses: Expense[];
}

function RecentExpenses({ recent_expenses }: RecentExpensesProps) {
    if (recent_expenses.length === 0) {
        return (
            <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Recent Expenses
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    No recent expenses
                </p>
            </div>
        );
    }

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-[400px] lg:h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Recent Expenses
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0">
                {recent_expenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 sm:gap-0 border-2 border-slate-200 dark:border-slate-800 rounded-2xl"
                    >
                        {/* Left section */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {expense.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {expense.category ? expense.category : 'N/A'}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {new Date(expense.date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Right section */}
                        <div className="text-right mt-2 sm:mt-0 min-w-[80px] sm:min-w-[120px]">
                            <p className=" font-bold text-slate-900 dark:text-slate-100 truncate">
                                ₱{parseFloat(expense.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {expense.payment_method}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
}

export default RecentExpenses;

