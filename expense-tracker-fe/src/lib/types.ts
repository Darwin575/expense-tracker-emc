export interface Expense {
    id: number
    user: number
    user_username: string
    category: number | null
    category_name: string | null
    title: string
    description: string
    amount: string
    payment_method: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
    date: string
    created_at: string
    updated_at: string
}

export interface Category {
    id: number
    name: string
    description: string
    color_code: string
    icon: string
    created_at: string
    updated_at: string
}

export interface CreateExpenseData {
    title: string
    description?: string
    amount: number
    payment_method: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
    date: string
    category?: number
}

export interface CreateCategoryData {
    name: string
    description?: string
    color?: string
    icon?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export interface DashboardStats {
    totalExpenses: number
    monthlyTotal: number
    categoryBreakdown: {
        category: string
        amount: number
        percentage: number
    }[]
    recentExpenses: Expense[]
    monthlyTrend: {
        month: string
        amount: number
    }[]
}

export interface DashboardStats {
    success: boolean;

    period: {
        current_month: string;
        month_name: string;
        start_date: string;
        end_date: string;
        days_in_month: number;
        days_passed: number;
    };

    spending: {
        total_this_month: number;
        total_this_week: number;
        total_today: number;
        transaction_count: number;
        daily_average: number;
    };

    budget: {
        amount: number;
        spent: number;
        remaining: number;
        utilization_percent: number;
        daily_recommended: number;
        status: "ok" | "warning" | "exceeded";
    };

    top_category: {
        id: number;
        name: string;
        color_code: string;
        amount: number;
        transaction_count: number;
        percentage: number;
    };

    categories: {
        id: number;
        name: string;
        color_code: string;
        amount: number;
        count: number;
        percentage: number;
    }[];

    top_expenses: Expense[];

    recent_expenses: Expense[];

    payment_methods: {
        method: "CASH" | "CARD" | string;
        amount: number;
        count: number;
        percentage: number;
    }[];

    comparison: {
        last_month_total: number;
        change_amount: number;
        change_percent: number;
        trend: "up" | "down" | "same";
    };
}

export interface RecurringExpense {
    id: number;
    title: string;
    amount: string;
    occurrences: number;
    category_name: string | null;
}

export interface RecurringExpensesResponse {
    daily: RecurringExpense[];
    weekly: RecurringExpense[];
    monthly: RecurringExpense[];
    yearly: RecurringExpense[];
}

export interface BudgetUsage {
    period: string;
    expense: number;
    budget: number;
    percentage_consumed: number;
    status: "over_budget" | "within_budget";
}

export interface BudgetAlertResponse {
    day: BudgetUsage;
    week: BudgetUsage;
    month: BudgetUsage;
    year: BudgetUsage;
}

export interface Budget {
    id: number;
    user: number;
    user_username: string;
    month: string;
    budget_amount: string;
}

export interface CreateBudgetData {
    month: string;
    budget_amount: number;
}

export type DateFilterType = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'LAST_YEAR'  