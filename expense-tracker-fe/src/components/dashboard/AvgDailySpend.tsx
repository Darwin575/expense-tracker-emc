import { Clock } from "lucide-react";
import { StatsCardSkeleton } from "@/components/skeletons/StatsCardSkeleton";
import { AlertCircle } from "lucide-react";

interface AvgDailySpendProps {
    stats: any;
    isLoading: boolean;
    isError: boolean;
}

export function AvgDailySpend({ stats, isLoading, isError }: AvgDailySpendProps) {
    if (isLoading) {
        return <StatsCardSkeleton />;
    }

    if (isError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    Failed to load stats
                </p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 h-full">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Avg per Day
                </h3>
                <div className="flex size-8 items-center justify-center rounded-full bg-slate-900/90 ring-1 ring-slate-800">
                    <Clock className="size-5 text-gray-300" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                ₱ {((stats?.spending?.total_this_month ?? 0) / 30).toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Based on 30 days</p>
        </div>
    );
}
