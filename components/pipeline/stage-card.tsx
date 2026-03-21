'use client';

import { Badge } from '@/components/ui';
import { Lock, PlayCircle, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import type { StageState } from '@/lib/stage-state-machine';

interface StageCardProps {
  stageNumber: number;
  agentName: string;
  state: StageState;
  cost?: number;
  duration?: number;
  output?: unknown;
  onRunAgent?: () => void;
  onApprove?: () => void;
  onViewOutput?: () => void;
  isExpanded?: boolean;
  children?: React.ReactNode;
}

const STATE_CONFIG: Record<StageState, {
  border: string;
  Icon: typeof Lock;
  badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  badgeLabel: string;
}> = {
  locked: {
    border: 'opacity-60',
    Icon: Lock,
    badgeVariant: 'outline',
    badgeLabel: 'Locked',
  },
  ready: {
    border: '',
    Icon: PlayCircle,
    badgeVariant: 'default',
    badgeLabel: 'Ready',
  },
  running: {
    border: 'ring-2 ring-blue-500/50',
    Icon: Loader2,
    badgeVariant: 'info',
    badgeLabel: 'Running',
  },
  review: {
    border: 'border-amber-200 dark:border-amber-800',
    Icon: Eye,
    badgeVariant: 'warning',
    badgeLabel: 'Review',
  },
  approved: {
    border: 'border-emerald-200 dark:border-emerald-800',
    Icon: CheckCircle2,
    badgeVariant: 'success',
    badgeLabel: 'Approved',
  },
  completed: {
    border: 'border-emerald-200 dark:border-emerald-800',
    Icon: CheckCircle2,
    badgeVariant: 'success',
    badgeLabel: 'Complete',
  },
};

export function StageCard({
  stageNumber,
  agentName,
  state,
  cost,
  onRunAgent,
  onApprove,
  onViewOutput,
  children,
}: StageCardProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.Icon;
  const isAnimated = state === 'running';

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 transition-all ${config.border}`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Icon + Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Icon className={`h-4.5 w-4.5 ${isAnimated ? 'animate-spin text-blue-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Stage {stageNumber}</span>
              <Badge variant={config.badgeVariant}>{config.badgeLabel}</Badge>
            </div>
            <h3 className="font-semibold text-sm mt-0.5">{agentName}</h3>
          </div>
        </div>

        {/* Right: Actions + Cost */}
        <div className="flex items-center gap-2">
          {cost != null && cost > 0 && (
            <span className="text-xs font-mono text-zinc-400">${cost.toFixed(4)}</span>
          )}

          {state === 'ready' && onRunAgent && (
            <button
              onClick={onRunAgent}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition-colors"
            >
              Run Agent
            </button>
          )}

          {state === 'review' && (
            <div className="flex items-center gap-1.5">
              {onViewOutput && (
                <button
                  onClick={onViewOutput}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  View Output
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Approve
                </button>
              )}
            </div>
          )}

          {(state === 'approved' || state === 'completed') && onViewOutput && (
            <button
              onClick={onViewOutput}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              View Output
            </button>
          )}
        </div>
      </div>

      {/* Children slot (e.g., ProspectSelector) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
