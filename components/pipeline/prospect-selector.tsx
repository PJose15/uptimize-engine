'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { ArrowRight, CheckSquare, Square } from 'lucide-react';
import { ProspectCard } from './prospect-card';
import type { LeadRecord } from '@/app/api/agents/run/uptimize/agent-1-market-intelligence/types';

interface ProspectSelectorProps {
  prospects: LeadRecord[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onApproveSelection: () => void;
  doNotTargetIds: string[];
  onDoNotTarget: (id: string) => void;
}

export function ProspectSelector({
  prospects,
  selectedIds,
  onSelectionChange,
  onApproveSelection,
  doNotTargetIds,
  onDoNotTarget,
}: ProspectSelectorProps) {
  const selectableProspects = useMemo(
    () => prospects.filter(p => !doNotTargetIds.includes(p.lead_id)),
    [prospects, doNotTargetIds]
  );

  const stats = useMemo(() => {
    const selected = prospects.filter(p => selectedIds.includes(p.lead_id));
    if (selected.length === 0) return { avgFit: 0, avgShadow: 0 };
    const avgFit = selected.reduce((sum, p) => sum + p.fit_score_0_100, 0) / selected.length;
    const avgShadow = selected.reduce((sum, p) => sum + p.shadow_ops_density_0_10, 0) / selected.length;
    return { avgFit: Math.round(avgFit), avgShadow: avgShadow.toFixed(1) };
  }, [prospects, selectedIds]);

  const allSelected = selectableProspects.length > 0 &&
    selectableProspects.every(p => selectedIds.includes(p.lead_id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableProspects.map(p => p.lead_id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select prospects to advance to outreach
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          {allSelected ? (
            <>
              <CheckSquare className="h-3.5 w-3.5" />
              Deselect All
            </>
          ) : (
            <>
              <Square className="h-3.5 w-3.5" />
              Select All
            </>
          )}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {prospects.map(prospect => (
          <ProspectCard
            key={prospect.lead_id}
            prospect={prospect}
            isSelected={selectedIds.includes(prospect.lead_id)}
            isDoNotTarget={doNotTargetIds.includes(prospect.lead_id)}
            onToggleSelect={() => toggleOne(prospect.lead_id)}
            onDoNotTarget={() => onDoNotTarget(prospect.lead_id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          {selectedIds.length > 0 && (
            <>
              <span>Avg Fit: <strong className="text-zinc-900 dark:text-zinc-100">{stats.avgFit}</strong></span>
              <span>Avg Shadow Ops: <strong className="text-zinc-900 dark:text-zinc-100">{stats.avgShadow}</strong></span>
            </>
          )}
        </div>
        <Button
          onClick={onApproveSelection}
          disabled={selectedIds.length === 0}
        >
          Approve Selected ({selectedIds.length})
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
