'use client';

import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type { AgentStatus } from './AgentCard';

interface Agent {
    id: number;
    name: string;
    status: AgentStatus;
}

interface PipelineFlowProps {
    agents: Agent[];
    className?: string;
}

const statusColors: Record<AgentStatus, string> = {
    pending: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
    running: 'bg-blue-500 text-white animate-pulse',
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
};

const connectorColors: Record<AgentStatus, string> = {
    pending: 'bg-zinc-200 dark:bg-zinc-700',
    running: 'bg-gradient-to-r from-blue-500 to-zinc-200 dark:to-zinc-700',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
};

export function PipelineFlow({ agents, className }: PipelineFlowProps) {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            {agents.map((agent, index) => (
                <div key={agent.id} className="flex items-center">
                    {/* Agent Node */}
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                                statusColors[agent.status]
                            )}
                        >
                            {agent.id}
                        </div>
                        <span className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 text-center max-w-[80px]">
                            {agent.name}
                        </span>
                    </div>

                    {/* Connector */}
                    {index < agents.length - 1 && (
                        <div className="flex items-center mx-2">
                            <div
                                className={cn(
                                    "h-1 w-12 rounded-full transition-all duration-300",
                                    connectorColors[agents[index + 1].status === 'pending' ? 'pending' : agent.status]
                                )}
                            />
                            <ArrowRight className={cn(
                                "h-4 w-4 -ml-1",
                                agent.status === 'success' ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'
                            )} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
