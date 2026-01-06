"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface DailyData {
    date: string;
    total: number;
}

interface WeeklyChartProps {
    data: DailyData[];
}

export default function WeeklySpendingChart({ data }: WeeklyChartProps) {
    if (data.length === 0) {
        return (
            <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Weekly Spending
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                    No weekly spending data available
                </p>
            </div>
        );
    }

    const formatDateWithMonth = (date: Date) =>
        `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;

    const getWeekRange = (date: Date) => {
        const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const monday = new Date(date);
        monday.setDate(date.getDate() - day);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mondayLabel = formatDateWithMonth(monday);
        const sundayLabel = formatDateWithMonth(sunday);

        if (monday.getMonth() === sunday.getMonth()) {
            return `${monday.toLocaleString("default", { month: "short" })} ${monday.getDate()} - ${sunday.getDate()}`;
        } else {
            return `${mondayLabel} - ${sundayLabel}`;
        }
    };


    const weekTotals: Record<string, number> = {};
    data.forEach(item => {
        const date = new Date(item.date);
        const rangeLabel = getWeekRange(date);
        if (!weekTotals[rangeLabel]) weekTotals[rangeLabel] = 0;
        weekTotals[rangeLabel] += item.total;
    });

    const weekRanges = Object.keys(weekTotals).map(label => ({
        label,
        total: weekTotals[label],
    }));

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-[360px]">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Weekly Spending
            </h2>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={weekRanges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₱${value.toFixed(2)}`}
                    />
                    <Tooltip
                        formatter={(value: number) => [`₱${value.toFixed(2)}`, "Total"]}
                        contentStyle={{
                            backgroundColor: "var(--tooltip-bg)",
                            border: "1px solid var(--tooltip-border)",
                            borderRadius: "8px",
                            color: "var(--tooltip-text)",
                        }}
                        itemStyle={{ color: "var(--tooltip-text)" }}
                    />
                    <Bar dataKey="total" className="fill-burnt-amber" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
