'use client';

import type { StageState } from '@/lib/stage-state-machine';

interface StageFlowItem {
  number: number;
  name: string;
  state: StageState;
}

interface StagePipelineFlowProps {
  stages: StageFlowItem[];
}

const STATE_COLORS: Record<StageState, { circle: string; text: string; connector: string }> = {
  locked: {
    circle: 'bg-zinc-200 dark:bg-zinc-700',
    text: 'text-zinc-400 dark:text-zinc-500',
    connector: 'bg-zinc-200 dark:bg-zinc-700',
  },
  ready: {
    circle: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    connector: 'bg-zinc-200 dark:bg-zinc-700',
  },
  running: {
    circle: 'bg-blue-500 animate-pulse',
    text: 'text-blue-600 dark:text-blue-400',
    connector: 'bg-blue-200 dark:bg-blue-800',
  },
  review: {
    circle: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    connector: 'bg-amber-200 dark:bg-amber-800',
  },
  approved: {
    circle: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    connector: 'bg-emerald-300 dark:bg-emerald-700',
  },
  completed: {
    circle: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    connector: 'bg-emerald-300 dark:bg-emerald-700',
  },
};

export function StagePipelineFlow({ stages }: StagePipelineFlowProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {stages.map((stage, i) => {
        const colors = STATE_COLORS[stage.state];
        return (
          <div key={stage.number} className="flex items-center flex-1 last:flex-none">
            {/* Stage circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${colors.circle}`}>
                {stage.number}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight max-w-[80px] ${colors.text}`}>
                {stage.name}
              </span>
            </div>
            {/* Connector line */}
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-16px] rounded-full ${colors.connector}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
