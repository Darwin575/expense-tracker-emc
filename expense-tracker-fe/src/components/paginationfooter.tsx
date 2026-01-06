import React from "react";

interface PaginationFooterProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const ROWS_OPTIONS = [5, 7, 10, 15, 20, 25];

export function PaginationFooter({
    currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange,
}: PaginationFooterProps) {
    if (totalItems === 0) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    const btn = "px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

    return (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left: Info & Rows selector */}
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>Showing {start}-{end} of {totalItems}</span>
                    {onItemsPerPageChange && (
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                            {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} rows</option>)}
                        </select>
                    )}
                </div>

                {/* Right: Navigation */}
                <div className="flex items-center gap-2">
                    <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={btn}>«</button>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={btn}>‹</button>
                    <span className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300">{currentPage} / {totalPages}</span>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={btn}>›</button>
                    <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={btn}>»</button>
                </div>
            </div>
        </div>
    );
}