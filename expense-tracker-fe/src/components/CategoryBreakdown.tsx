import React from "react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
interface CategoryBreakdownProps {
    data: Array<{
        name: string;
        value: number;
        color: string;
        count: number;
        percentage: number;
        average: number;
        largest: number;
    }>;
}

function CategoryBreakdown({ data }: CategoryBreakdownProps) {
    if (data.length === 0) {
        return (
            <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Category Breakdown
                </h2>

                <p className="text-slate-500 dark:text-slate-400">
                    No category data available
                </p>
            </div>
        );
    }

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Category Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry: any) => (
                            <Cell key={entry.id} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--tooltip-bg)",
                            border: "1px solid var(--tooltip-border)",
                            borderRadius: "8px",
                            color: "var(--tooltip-text)",
                        }}
                        itemStyle={{ color: "var(--tooltip-text)" }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.map((entry: any) => (
                    <div key={entry.category} className="flex items-center gap-2">
                        <div
                            className="size-8 rounded-md"
                            style={{ backgroundColor: entry.color }}
                        />
                        <h3 className="text-sm text-slate-600 dark:text-slate-400">
                            {entry.name}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryBreakdown;

