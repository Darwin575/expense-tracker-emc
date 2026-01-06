import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface PaymentBreakdownProps {
    data: Array<{
        method: string;
        label: string;
        icon: string;
        total: number;
        count: number;
        color: string;
        percentage: number;
        average_per_transaction: number;
        largest_transaction: number;
    }>;
}

function PaymentBreakdown({ data }: PaymentBreakdownProps) {
    if (data.length === 0) {
        return (
            <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                    Payment Methods
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    No payment methods to display
                </p>
            </div>
        );
    }

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
                Payment Methods
            </h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="method"
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
                        cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                        formatter={(value: number) => `₱${value.toFixed(2)}`}
                    />
                    <Bar
                        dataKey="total"
                        fill="#C56606"
                        radius={[4, 4, 0, 0]}
                        className="fill-burnt-amber dark:fill-burnt-amber"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default PaymentBreakdown;

