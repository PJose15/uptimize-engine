'use client';

import {
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowUpRight,
    BarChart3,
} from 'lucide-react';
import { usePortalData } from '../use-portal-data';
import { CardSkeleton, MetricSkeleton, ErrorBanner } from '../loading-skeleton';
import type { PillarMetric } from '../mock-data';

interface AnalyticsData {
    pillar_metrics: PillarMetric[];
    hours_saved_trend: { week: string; hours: number }[];
    health_score_trend: { week: string; score: number }[];
    stats: {
        hours_saved_week: number;
        health_score: number;
        exceptions_auto_resolved: number;
    } | null;
}

export default function AnalyticsPage() {
    const { data, loading, error, refetch } = usePortalData<AnalyticsData>('/api/portal/analytics');

    const pillarMetrics = data?.pillar_metrics || [];
    const hoursSavedTrend = data?.hours_saved_trend || [];
    const healthScoreTrend = data?.health_score_trend || [];
    const stats = data?.stats;

    return (
        <div className="p-8 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analytics</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    6-pillar performance metrics — before and after your agent was deployed.
                </p>
            </div>

            {error && <div className="mb-6"><ErrorBanner message={error} onRetry={refetch} /></div>}

            {/* Top-level summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {loading || !stats ? (
                    <>
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                    </>
                ) : (
                    <>
                        <SummaryCard label="Hours Saved / Week" value={`${stats.hours_saved_week}h`} change="+106%" positive />
                        <SummaryCard label="Health Score" value={`${stats.health_score}/100`} change="+24%" positive />
                        <SummaryCard label="Exceptions Auto-Resolved" value={`${stats.exceptions_auto_resolved}%`} change="+42%" positive />
                    </>
                )}
            </div>

            {/* 6 Pillar Cards */}
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">6-Pillar Breakdown</h2>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {pillarMetrics.map((pillar) => (
                        <PillarCard key={pillar.pillar} pillar={pillar} />
                    ))}
                </div>
            )}

            {/* Trend Charts */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart
                        title="Hours Saved Per Week"
                        data={hoursSavedTrend.map(d => ({ label: d.week, value: d.hours }))}
                        suffix="h"
                        color="emerald"
                    />
                    <TrendChart
                        title="Health Score Trend"
                        data={healthScoreTrend.map(d => ({ label: d.week, value: d.score }))}
                        suffix="/100"
                        color="violet"
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SummaryCard({ label, value, change, positive }: {
    label: string;
    value: string;
    change: string;
    positive: boolean;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                    {positive ? <ArrowUpRight className="h-3 w-3" /> : null}
                    {change}
                </span>
            </div>
        </div>
    );
}

function PillarCard({ pillar }: { pillar: PillarMetric }) {
    const improvement = pillar.trend === 'down'
        ? ((pillar.before - pillar.after) / pillar.before * 100)
        : ((pillar.after - pillar.before) / Math.max(pillar.before, 1) * 100);

    const isPositive = (pillar.trend === 'down' && pillar.after < pillar.before) ||
        (pillar.trend === 'up' && pillar.after > pillar.before);

    const TrendIcon = pillar.trend === 'up' ? TrendingUp :
        pillar.trend === 'down' ? TrendingDown : Minus;

    // Bar widths
    const maxVal = Math.max(pillar.before, pillar.after, 1);
    const beforeWidth = (pillar.before / maxVal) * 100;
    const afterWidth = (pillar.after / maxVal) * 100;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{pillar.icon}</span>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pillar.label}</h3>
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(improvement).toFixed(0)}%
                </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{pillar.description}</p>

            {/* Before/After bars */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-10">Before</span>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-zinc-300 dark:bg-zinc-600 rounded-full transition-all duration-700"
                            style={{ width: `${beforeWidth}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 w-16 text-right">{pillar.before} {pillar.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-10">After</span>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                                }`}
                            style={{ width: `${afterWidth}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 w-16 text-right">{pillar.after} {pillar.unit}</span>
                </div>
            </div>
        </div>
    );
}

function TrendChart({ title, data, suffix, color }: {
    title: string;
    data: { label: string; value: number }[];
    suffix: string;
    color: 'emerald' | 'violet';
}) {
    const maxVal = Math.max(...data.map(d => d.value));
    const colorClass = color === 'emerald'
        ? 'from-emerald-500 to-teal-400'
        : 'from-violet-500 to-indigo-400';

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                <BarChart3 className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-end gap-3 h-36">
                {data.map((point, i) => {
                    const height = (point.value / maxVal) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                                {point.value}{suffix}
                            </span>
                            <div
                                className={`w-full rounded-t-lg bg-gradient-to-t ${colorClass} transition-all duration-500 hover:opacity-80`}
                                style={{ height: `${height}%`, minHeight: '8px' }}
                            />
                            <span className="text-[10px] text-zinc-400">{point.label.split(' ').pop()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
