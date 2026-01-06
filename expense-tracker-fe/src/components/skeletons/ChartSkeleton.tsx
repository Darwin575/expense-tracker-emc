export function ChartSkeleton() {
    return (
        <div className="bg-sky-mist dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-[300px] bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
    );
}