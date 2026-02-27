'use client';

/**
 * Reusable loading skeleton matching portal card style
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse ${className}`}>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
            </div>
        </div>
    );
}

export function MetricSkeleton() {
    return (
        <div className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 p-5 animate-pulse h-[120px]" />
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24" /></td>
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-48" /></td>
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16" /></td>
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16" /></td>
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-12" /></td>
            <td className="px-5 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-12" /></td>
        </tr>
    );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
            <button
                onClick={onRetry}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
            >
                Retry
            </button>
        </div>
    );
}

export function SidebarSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-zinc-200 dark:bg-zinc-700 rounded-lg p-3">
                <div className="h-3 bg-zinc-300 dark:bg-zinc-600 rounded w-2/3 mb-2" />
                <div className="h-2 bg-zinc-300 dark:bg-zinc-600 rounded w-full" />
            </div>
        </div>
    );
}
