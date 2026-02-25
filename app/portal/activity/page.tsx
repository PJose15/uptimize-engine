'use client';

import { useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Filter,
    Search,
} from 'lucide-react';
import { mockActivity, type ActivityEntry } from '../mock-data';

const pillarFilters = ['All', 'Shadow Ops', 'Exceptions', 'Audit Trail', 'Knowledge', 'Handoffs', 'Channels'];
const statusFilters = ['All', 'completed', 'pending', 'failed'];

export default function ActivityPage() {
    const [selectedPillar, setSelectedPillar] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = mockActivity.filter((entry) => {
        if (selectedPillar !== 'All' && entry.pillar !== selectedPillar) return false;
        if (selectedStatus !== 'All' && entry.status !== selectedStatus) return false;
        if (searchQuery && !entry.action.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Activity Feed</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Everything your agent has done, in human-readable form.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search actions..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                {/* Pillar Filter */}
                <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 mr-1" />
                    {pillarFilters.map((pillar) => (
                        <button
                            key={pillar}
                            onClick={() => setSelectedPillar(pillar)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${selectedPillar === pillar
                                    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {pillar}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-700 pl-3 ml-1">
                    {statusFilters.map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize ${selectedStatus === status
                                    ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            {status === 'All' ? 'All Status' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No matching activities found</p>
                    </div>
                ) : (
                    filtered.map((entry, i) => (
                        <ActivityRow key={entry.id} entry={entry} isLast={i === filtered.length - 1} />
                    ))
                )}
            </div>
        </div>
    );
}

function ActivityRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const StatusIcon = entry.status === 'completed' ? CheckCircle2 :
        entry.status === 'failed' ? XCircle :
            entry.status === 'pending' ? Clock : AlertCircle;

    const statusColor = entry.status === 'completed' ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10' :
        entry.status === 'failed' ? 'text-red-500 bg-red-100 dark:bg-red-500/10' :
            entry.status === 'pending' ? 'text-amber-500 bg-amber-100 dark:bg-amber-500/10' :
                'text-zinc-400 bg-zinc-100 dark:bg-zinc-800';

    const date = new Date(entry.timestamp);

    return (
        <div className="flex gap-4 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center w-8">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusColor}`}>
                    <StatusIcon className="h-4 w-4" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800 my-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-6 ${!isLast ? '' : ''}`}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-left bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{entry.action}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-zinc-400">
                                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
                                    {entry.pillar}
                                </span>
                                {entry.tool_used && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        via {entry.tool_used}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${entry.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                                    entry.status === 'failed' ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
                                        'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                }`}>
                                {entry.status}
                            </span>
                        </div>
                    </div>

                    {expanded && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{entry.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                                <span>Duration: {(entry.duration_ms / 1000).toFixed(1)}s</span>
                                <span>Cost: ${entry.cost_usd.toFixed(3)}</span>
                            </div>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
