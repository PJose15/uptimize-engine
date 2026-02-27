'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    MessageSquare,
} from 'lucide-react';
import type { ApprovalItem } from '../mock-data';
import { CardSkeleton, ErrorBanner } from '../loading-skeleton';

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [noteInput, setNoteInput] = useState<Record<string, string>>({});
    const [deciding, setDeciding] = useState<string | null>(null);

    const fetchApprovals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/portal/approvals');
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            setApprovals(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    const pending = approvals.filter(a => a.status === 'pending');
    const history = approvals.filter(a => a.status !== 'pending');

    const handleDecision = async (id: string, decision: 'approved' | 'denied') => {
        setDeciding(id);
        // Optimistic update
        setApprovals(prev => prev.map(a =>
            a.id === id ? {
                ...a,
                status: decision,
                decided_at: new Date().toISOString(),
                decided_by: 'You',
                note: noteInput[id] || null,
            } : a
        ));

        try {
            const res = await fetch('/api/portal/approvals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    decision,
                    decided_by: 'Portal User',
                    note: noteInput[id] || null,
                }),
            });

            if (!res.ok) {
                // Revert on failure
                fetchApprovals();
            }
        } catch {
            // Revert on error
            fetchApprovals();
        } finally {
            setDeciding(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl space-y-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Approvals</h1>
                </div>
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Approvals</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Review and approve actions your agent needs permission for.
                </p>
            </div>

            {error && <div className="mb-4"><ErrorBanner message={error} onRetry={fetchApprovals} /></div>}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${activeTab === 'pending'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                >
                    Pending {pending.length > 0 && (
                        <span className="ml-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                            {pending.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${activeTab === 'history'
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                >
                    History ({history.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                pending.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-60" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">All caught up!</p>
                        <p className="text-xs text-zinc-400 mt-1">No actions waiting for your approval.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pending.map(item => (
                            <ApprovalCard
                                key={item.id}
                                item={item}
                                note={noteInput[item.id] || ''}
                                onNoteChange={(val) => setNoteInput(prev => ({ ...prev, [item.id]: val }))}
                                onApprove={() => handleDecision(item.id, 'approved')}
                                onDeny={() => handleDecision(item.id, 'denied')}
                                disabled={deciding === item.id}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    {history.map(item => (
                        <HistoryRow key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ApprovalCard({ item, note, onNoteChange, onApprove, onDeny, disabled }: {
    item: ApprovalItem;
    note: string;
    onNoteChange: (val: string) => void;
    onApprove: () => void;
    onDeny: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${item.risk_level === 'high' ? 'bg-red-100 dark:bg-red-500/10' :
                            item.risk_level === 'medium' ? 'bg-amber-100 dark:bg-amber-500/10' :
                                'bg-emerald-100 dark:bg-emerald-500/10'
                        }`}>
                        {item.risk_level === 'high' ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" /> :
                            item.risk_level === 'medium' ? <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" /> :
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.action}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{item.description}</p>
                    </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 uppercase tracking-wide ${item.risk_level === 'high' ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
                        item.risk_level === 'medium' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                            'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}>
                    {item.risk_level} risk
                </span>
            </div>

            <div className="flex items-center gap-4 mb-4 text-xs text-zinc-400">
                <span>System: <span className="text-zinc-600 dark:text-zinc-300">{item.affected_system}</span></span>
                <span>•</span>
                <span>Reason: <span className="text-zinc-600 dark:text-zinc-300">{item.reason}</span></span>
                <span>•</span>
                <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-zinc-400 mt-2" />
                <input
                    type="text"
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="Add a note (optional)..."
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-400"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onApprove}
                    disabled={disabled}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                </button>
                <button
                    onClick={onDeny}
                    disabled={disabled}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    Deny
                </button>
            </div>
        </div>
    );
}

function HistoryRow({ item }: { item: ApprovalItem }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-500/10' :
                    item.status === 'denied' ? 'bg-red-100 dark:bg-red-500/10' :
                        'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                {item.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> :
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold capitalize ${item.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {item.status}
                    </span>
                    {item.decided_by && <span className="text-xs text-zinc-400">by {item.decided_by}</span>}
                    {item.decided_at && <span className="text-xs text-zinc-400">• {new Date(item.decided_at).toLocaleString()}</span>}
                </div>
                {item.note && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 italic">&rdquo;{item.note}&rdquo;</p>}
            </div>
        </div>
    );
}
