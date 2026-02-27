'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ScrollText,
    Search,
    Download,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    AlertCircle,
    Filter,
} from 'lucide-react';
import type { AuditEntry } from '../mock-data';
import { CardSkeleton, ErrorBanner } from '../loading-skeleton';

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    success: {
        color: 'text-emerald-600 dark:text-emerald-400',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    approved: {
        color: 'text-blue-600 dark:text-blue-400',
        icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
    denied: {
        color: 'text-red-600 dark:text-red-400',
        icon: <XCircle className="h-3.5 w-3.5" />,
    },
    failed: {
        color: 'text-amber-600 dark:text-amber-400',
        icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
};

export default function AuditPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);
            const res = await fetch(`/api/portal/audit?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            setAuditLog(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    const exportCSV = () => {
        const headers = ['Timestamp', 'Action', 'Tool', 'Status', 'Approved By', 'Cost (USD)', 'Details'];
        const rows = auditLog.map(e => [
            e.timestamp,
            e.action,
            e.tool,
            e.status,
            e.approved_by || '',
            e.cost_usd.toFixed(3),
            e.details,
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uptimize-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-6xl">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Audit Log</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Immutable record of every action — proof-grade, exportable.
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {error && <div className="mb-4"><ErrorBanner message={error} onRetry={fetchAudit} /></div>}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search audit log..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 mr-1" />
                    {['all', 'success', 'approved', 'denied', 'failed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize ${statusFilter === status
                                    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <CardSkeleton />
            ) : (
                <>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                        <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                                        <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Action</th>
                                        <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Tool</th>
                                        <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Status</th>
                                        <th className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">By</th>
                                        <th className="text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {auditLog.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-zinc-400">
                                                <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No matching audit entries</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        auditLog.map((entry) => (
                                            <AuditRow key={entry.id} entry={entry} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                        <span>{auditLog.length} entries</span>
                        <span>Total cost: ${auditLog.reduce((s, e) => s + e.cost_usd, 0).toFixed(3)}</span>
                    </div>
                </>
            )}
        </div>
    );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
    const config = statusConfig[entry.status] || statusConfig.success;
    const date = new Date(entry.timestamp);

    return (
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <td className="px-5 py-3">
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </td>
            <td className="px-5 py-3">
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium max-w-xs truncate" title={entry.action}>
                    {entry.action}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xs truncate" title={entry.details}>
                    {entry.details}
                </p>
            </td>
            <td className="px-5 py-3">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {entry.tool}
                </span>
            </td>
            <td className="px-5 py-3">
                <span className={`flex items-center gap-1.5 text-xs font-semibold capitalize ${config.color}`}>
                    {config.icon}
                    {entry.status}
                </span>
            </td>
            <td className="px-5 py-3">
                <span className="text-xs text-zinc-500">
                    {entry.approved_by || '—'}
                </span>
            </td>
            <td className="px-5 py-3 text-right">
                <span className="text-xs font-mono text-zinc-500">
                    {entry.cost_usd > 0 ? `$${entry.cost_usd.toFixed(3)}` : '—'}
                </span>
            </td>
        </tr>
    );
}
