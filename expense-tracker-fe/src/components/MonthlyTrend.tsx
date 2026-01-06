import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface MonthlyTrendProps {
    data: Array<{
        month: string;
        total: number;
        month_short: string;
        month_name: string;
        count: number;
        average_per_expense: number;
        largest_expense: number;
        smallest_expense: number;
    }>;
}

export default function MonthlyTrendChart({ data }: MonthlyTrendProps) {
    if (data.length === 0) {
        return (
            <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Monthly Spending Trend
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    No monthly trends to display
                </p>
            </div>
        );
    }

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Monthly Spending Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₱${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--tooltip-bg)",
                            border: "1px solid var(--tooltip-border)",
                            borderRadius: "8px",
                            color: "var(--tooltip-text)",
                        }}
                        itemStyle={{ color: "var(--tooltip-text)" }}
                        formatter={(value: number) => `₱${value.toFixed(2)}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#098C7C"
                        strokeWidth={2}
                        dot={{ fill: "#098C7C", r: 4 }}
                        activeDot={{ r: 6 }}
                        className="stroke-teal-reef dark:stroke-teal-reef"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

