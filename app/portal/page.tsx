'use client';

import Link from 'next/link';
import {
    Activity,
    Clock,
    ShieldCheck,
    Heart,
    TrendingUp,
    ArrowRight,
    Zap,
    CheckCircle2,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import {
    mockClient,
    mockStats,
    mockActivity,
    mockApprovals,
    mockHoursSavedTrend,
} from './mock-data';

export default function PortalOverview() {
    const stats = mockStats;
    const recentActivity = mockActivity.slice(0, 4);
    const pendingApprovals = mockApprovals.filter(a => a.status === 'pending');

    return (
        <div className="p-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Welcome back, {mockClient.name.split(' ')[0]}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Here&apos;s what <span className="font-medium text-violet-600 dark:text-violet-400">{mockClient.agent.name}</span> has been doing for {mockClient.company}.
                </p>
            </div>

            {/* Hero Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricHero
                    label="Actions Today"
                    value={stats.actions_today}
                    icon={<Activity className="h-5 w-5" />}
                    color="violet"
                />
                <MetricHero
                    label="Hours Saved This Week"
                    value={stats.hours_saved_week}
                    suffix="hrs"
                    icon={<Clock className="h-5 w-5" />}
                    color="emerald"
                />
                <MetricHero
                    label="Pending Approvals"
                    value={stats.pending_approvals}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    color="amber"
                    href="/portal/approvals"
                />
                <MetricHero
                    label="Health Score"
                    value={stats.health_score}
                    suffix="/100"
                    icon={<Heart className="h-5 w-5" />}
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hours Saved Trend */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Hours Saved Over Time</h2>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {mockHoursSavedTrend.map((point, i) => {
                            const maxVal = Math.max(...mockHoursSavedTrend.map(p => p.hours));
                            const height = (point.hours / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-zinc-500 font-medium">{point.hours}h</span>
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                                        style={{ height: `${height}%`, minHeight: '8px' }}
                                    />
                                    <span className="text-[10px] text-zinc-400">{point.week.split(' ')[1]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">This Month</h2>
                    <div className="space-y-4">
                        <QuickStat label="Total Actions" value={stats.total_actions_month.toString()} />
                        <QuickStat label="Success Rate" value={`${stats.success_rate}%`} />
                        <QuickStat label="Exceptions Auto-Resolved" value={`${stats.exceptions_auto_resolved}%`} />
                        <QuickStat label="Total Cost" value={`$${stats.total_cost_month.toFixed(2)}`} />
                    </div>
                </div>
            </div>

            {/* Recent Activity + Pending Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Activity</h2>
                        <Link href="/portal/activity" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3 py-2">
                                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${entry.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10' :
                                        entry.status === 'failed' ? 'bg-red-100 dark:bg-red-500/10' :
                                            'bg-zinc-100 dark:bg-zinc-800'
                                    }`}>
                                    {entry.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> :
                                        entry.status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> :
                                            <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium truncate">{entry.action}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {entry.pillar && <span className="ml-2 text-violet-500">• {entry.pillar}</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pending Approvals</h2>
                        <Link href="/portal/approvals" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                            Review all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {pendingApprovals.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">
                            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No pending approvals</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingApprovals.map((item) => (
                                <div key={item.id} className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3">
                                    <div className="flex items-start justify-between mb-1">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 pr-2">{item.action}</p>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${item.risk_level === 'high' ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
                                                item.risk_level === 'medium' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                                                    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                            }`}>
                                            {item.risk_level}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{item.reason}</p>
                                    <div className="flex gap-2">
                                        <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                                            Approve
                                        </button>
                                        <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                            Deny
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricHero({ label, value, suffix, icon, color, href }: {
    label: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
    color: string;
    href?: string;
}) {
    const colorMap: Record<string, string> = {
        violet: 'from-violet-500 to-indigo-600',
        emerald: 'from-emerald-500 to-teal-600',
        amber: 'from-amber-500 to-orange-600',
        rose: 'from-rose-500 to-pink-600',
    };

    const content = (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg ${href ? 'hover:scale-[1.02] transition-transform cursor-pointer' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-white/80">{icon}</span>
                {href && <ArrowRight className="h-4 w-4 text-white/60" />}
            </div>
            <p className="text-3xl font-bold">
                {value}{suffix && <span className="text-lg font-normal ml-1 opacity-80">{suffix}</span>}
            </p>
            <p className="text-sm text-white/80 mt-1">{label}</p>
        </div>
    );

    if (href) return <Link href={href}>{content}</Link>;
    return content;
}

function QuickStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
        </div>
    );
}
