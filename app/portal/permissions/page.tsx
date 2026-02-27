'use client';

import { Lock, Eye, PenLine, Zap, Ban } from 'lucide-react';
import { usePortalData } from '../use-portal-data';
import { CardSkeleton, ErrorBanner } from '../loading-skeleton';
import type { PermissionGroup, PermissionTool } from '../mock-data';

interface ClientData {
    name: string;
    company: string;
    agent: { name: string };
}

const accessConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    read: {
        label: 'Read',
        color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
        icon: <Eye className="h-3 w-3" />,
        description: 'Can view data',
    },
    write: {
        label: 'Write',
        color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
        icon: <PenLine className="h-3 w-3" />,
        description: 'Can modify data',
    },
    execute: {
        label: 'Execute',
        color: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
        icon: <Zap className="h-3 w-3" />,
        description: 'Can perform actions (requires approval)',
    },
    none: {
        label: 'No Access',
        color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
        icon: <Ban className="h-3 w-3" />,
        description: 'Blocked',
    },
};

export default function PermissionsPage() {
    const { data: client, loading: clientLoading } = usePortalData<ClientData>('/api/portal/client');
    const { data: permissions, loading: permsLoading, error, refetch } = usePortalData<PermissionGroup[]>('/api/portal/permissions');

    const agentName = client?.agent?.name || 'your agent';
    const loading = clientLoading || permsLoading;

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Permissions</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    What <span className="font-medium text-violet-600 dark:text-violet-400">{agentName}</span> is allowed to do — grouped by system.
                </p>
            </div>

            {error && <div className="mb-4"><ErrorBanner message={error} onRetry={refetch} /></div>}

            {/* Access Level Legend */}
            <div className="flex items-center gap-4 mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <span className="text-xs text-zinc-500 font-medium">Access Levels:</span>
                {Object.entries(accessConfig).map(([key, config]) => (
                    <span key={key} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${config.color}`}>
                        {config.icon}
                        {config.label}
                    </span>
                ))}
            </div>

            {/* Permission Groups */}
            {loading ? (
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <div className="space-y-4">
                    {(permissions || []).map((group) => (
                        <div key={group.category} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            {/* Group Header */}
                            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                <span className="text-xl">{group.icon}</span>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{group.category}</h3>
                                <span className="text-xs text-zinc-400">
                                    {group.tools.length} permission{group.tools.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Tools list */}
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {group.tools.map((tool) => {
                                    const config = accessConfig[tool.access];
                                    return (
                                        <div key={tool.id} className="px-6 py-3.5 flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{tool.name}</p>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{tool.description}</p>
                                            </div>

                                            {/* Access Level Badge */}
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 ${config.color}`}>
                                                {config.icon}
                                                {config.label}
                                            </span>

                                            {/* Last used */}
                                            <span className="text-[11px] text-zinc-400 w-28 text-right flex-shrink-0">
                                                {tool.last_used
                                                    ? `Used ${timeAgo(tool.last_used)}`
                                                    : 'Never used'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Note */}
            <div className="mt-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                <Lock className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">Permissions are managed by Uptimize</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Contact your account manager to request permission changes. All &ldquo;Execute&rdquo; actions require your approval before they run.
                    </p>
                </div>
            </div>
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}
