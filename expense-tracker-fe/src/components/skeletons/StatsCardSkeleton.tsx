export function StatsCardSkeleton() {
  return (
    <div className="bg-sky-mist dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          <div className="size-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
    </div>
  );
}