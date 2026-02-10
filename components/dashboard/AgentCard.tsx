'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

export type AgentStatus = 'pending' | 'running' | 'success' | 'error';

interface AgentCardProps {
    agentNumber: number;
    name: string;
    description: string;
    status: AgentStatus;
    duration?: number;
    outputPreview?: string;
    className?: string;
}

const statusConfig = {
    pending: {
        icon: Circle,
        label: 'Pending',
        variant: 'outline' as const,
        iconClass: 'text-zinc-400',
    },
    running: {
        icon: Loader2,
        label: 'Running',
        variant: 'info' as const,
        iconClass: 'text-blue-500 animate-spin',
    },
    success: {
        icon: CheckCircle2,
        label: 'Complete',
        variant: 'success' as const,
        iconClass: 'text-emerald-500',
    },
    error: {
        icon: XCircle,
        label: 'Failed',
        variant: 'error' as const,
        iconClass: 'text-red-500',
    },
};

export function AgentCard({
    agentNumber,
    name,
    description,
    status,
    duration,
    outputPreview,
    className,
}: AgentCardProps) {
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <Card className={cn(
            "transition-all duration-300",
            status === 'running' && "ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10",
            status === 'success' && "border-emerald-200 dark:border-emerald-800",
            className
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold",
                            "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                        )}>
                            {agentNumber}
                        </div>
                        <div>
                            <CardTitle className="text-base">{name}</CardTitle>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <StatusIcon className={cn("h-5 w-5", config.iconClass)} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                {duration !== undefined && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        Duration: {(duration / 1000).toFixed(1)}s
                    </p>
                )}
                {outputPreview && (
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-xs font-mono text-zinc-600 dark:text-zinc-300 max-h-24 overflow-hidden">
                        {outputPreview}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
