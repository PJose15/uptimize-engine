'use client';

import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Check, X, Ban } from 'lucide-react';
import type { LeadRecord } from '@/app/api/agents/run/uptimize/agent-1-market-intelligence/types';

interface ProspectCardProps {
  prospect: LeadRecord;
  isSelected: boolean;
  isDoNotTarget: boolean;
  onToggleSelect: () => void;
  onDoNotTarget: () => void;
}

function fitScoreColor(score: number): string {
  if (score < 50) return 'text-red-600 dark:text-red-400';
  if (score <= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function fitScoreBg(score: number): string {
  if (score < 50) return 'bg-red-100 dark:bg-red-900/30';
  if (score <= 70) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-emerald-100 dark:bg-emerald-900/30';
}

function densityBarWidth(density: number): string {
  return `${Math.min(density * 10, 100)}%`;
}

export function ProspectCard({
  prospect,
  isSelected,
  isDoNotTarget,
  onToggleSelect,
  onDoNotTarget,
}: ProspectCardProps) {
  const borderClass = isDoNotTarget
    ? 'border-red-200 dark:border-red-800 opacity-60'
    : isSelected
      ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
      : 'border-zinc-200 dark:border-zinc-800';

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 transition-all ${borderClass}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm truncate">{prospect.name}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {prospect.company} &middot; {prospect.role}
          </p>
        </div>
        <div className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${fitScoreBg(prospect.fit_score_0_100)} ${fitScoreColor(prospect.fit_score_0_100)}`}>
          {prospect.fit_score_0_100}
        </div>
      </div>

      {/* Segment + Shadow Ops */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px]">{prospect.segment}</Badge>
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-[10px] text-zinc-400">Shadow Ops</span>
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: densityBarWidth(prospect.shadow_ops_density_0_10) }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{prospect.shadow_ops_density_0_10}</span>
        </div>
      </div>

      {/* Pain Categories */}
      {prospect.pain_categories.length > 0 && (
        <ul className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 space-y-0.5">
          {prospect.pain_categories.map((cat, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-zinc-400 mt-0.5">&#8226;</span>
              <span>{cat}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Hook */}
      <p className="text-xs italic text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
        &ldquo;{prospect.hooks.primary_hook_140_chars}&rdquo;
      </p>

      {/* Trigger Event */}
      {prospect.trigger_event && (
        <p className="text-[10px] text-zinc-400 mb-3 truncate">
          Trigger: {prospect.trigger_event}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          onClick={onToggleSelect}
          disabled={isDoNotTarget}
          className="flex-1 text-xs h-7"
        >
          <Check className="h-3 w-3 mr-1" />
          {isSelected ? 'Selected' : 'Select'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleSelect}
          disabled={!isSelected || isDoNotTarget}
          className="text-xs h-7"
        >
          <X className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant={isDoNotTarget ? 'destructive' : 'ghost'}
          onClick={onDoNotTarget}
          className="text-xs h-7"
        >
          <Ban className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
