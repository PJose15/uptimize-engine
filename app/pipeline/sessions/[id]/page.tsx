'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/lib/use-session';
import { deriveStageStates, buildAgentContext } from '@/lib/stage-state-machine';
import { StagePipelineFlow, StageCard, ProspectSelector, AgentOutputViewer } from '@/components/pipeline';
import { Button, Badge } from '@/components/ui';
import { ArrowLeft, Loader2, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { LeadRecord } from '@/app/api/agents/run/uptimize/agent-1-market-intelligence/types';

const AGENT_NAMES: Record<number, string> = {
  1: 'Market Intelligence',
  2: 'Outbound & Appointment',
  3: 'Sales Engineer',
  4: 'Systems Delivery',
  5: 'Client Success',
};

export default function SessionWorkspacePage() {
  const params = useParams();
  const sessionId = params.id as string;
  const {
    session,
    loading,
    error,
    refetch,
    saving,
    saveOutput,
    saveProspectSelection,
    saveBookingSelection,
    approveStage,
    completeSession,
  } = useSession(sessionId);

  const [runningAgent, setRunningAgent] = useState<number | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [expandedOutputs, setExpandedOutputs] = useState<Set<number>>(new Set());

  // Prospect selection state (stage 1 → 2)
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [doNotTargetIds, setDoNotTargetIds] = useState<string[]>([]);

  // Booking selection state (stage 2 → 3)
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

  const toggleOutput = useCallback((agentId: number) => {
    setExpandedOutputs(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const handleRunAgent = useCallback(async (agentId: number) => {
    if (!session || runningAgent !== null) return;

    setRunningAgent(agentId);
    setRunError(null);

    const { task, context } = buildAgentContext(agentId, session);

    try {
      const res = await fetch(`/api/agents/run/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context, mode: 'balanced' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Agent ${agentId} failed`);
      }

      // Save output to session
      await saveOutput(agentId, data.result, 0);

      // Auto-expand the output
      setExpandedOutputs(prev => new Set(prev).add(agentId));
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunningAgent(null);
    }
  }, [session, runningAgent, saveOutput]);

  const handleApproveProspects = useCallback(async () => {
    if (selectedProspectIds.length === 0) return;
    await saveProspectSelection(selectedProspectIds);
  }, [selectedProspectIds, saveProspectSelection]);

  const handleApproveBookings = useCallback(async () => {
    if (selectedBookingIds.length === 0) return;
    await saveBookingSelection(selectedBookingIds);
  }, [selectedBookingIds, saveBookingSelection]);

  const handleApproveStage = useCallback(async (stageNum: number) => {
    await approveStage(stageNum);
  }, [approveStage]);

  const handleCompleteSession = useCallback(async () => {
    await completeSession();
  }, [completeSession]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/pipeline/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  const stages = deriveStageStates(session, runningAgent);
  const currentStageNum = Math.max(session.currentStage, 0);

  // Extract prospects from Agent 1 output for the selector
  const agent1Output = session.agent1Output as Record<string, unknown> | null;
  const prospects: LeadRecord[] = agent1Output && Array.isArray(agent1Output.target_pack_primary)
    ? agent1Output.target_pack_primary as LeadRecord[]
    : [];

  // Extract bookings from Agent 2 output
  const agent2Output = session.agent2Output as Record<string, unknown> | null;
  const bookings: Array<{ id: string; name: string; company: string; status: string }> =
    agent2Output && Array.isArray(agent2Output.booked_meetings)
      ? (agent2Output.booked_meetings as Array<{ id: string; name: string; company: string; status: string }>)
      : [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <Link
        href="/pipeline/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{session.label}</h1>
            <Badge variant={session.status === 'completed' ? 'success' : session.status === 'paused' ? 'warning' : 'default'}>
              {session.status}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Started {new Date(session.createdAt).toLocaleDateString()} &middot;
            Stage {currentStageNum}/5 &middot;
            Cost: ${session.totalCost.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session.status === 'completed' && (
            <Link href={`/pipeline/sessions/${session.id}/report`}>
              <Button variant="outline" size="sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Report
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
        <StagePipelineFlow
          stages={stages.map(s => ({ number: s.number, name: s.name, state: s.state }))}
        />
      </div>

      {/* Run Error */}
      {runError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 mb-4">
          {runError}
          <button
            onClick={() => setRunError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}

      {/* Stage Cards */}
      <div className="space-y-4">
        {stages.map(stage => {
          const output = getOutput(session, stage.number);

          return (
            <StageCard
              key={stage.number}
              stageNumber={stage.number}
              agentName={AGENT_NAMES[stage.number]}
              state={stage.state}
              cost={getAgentCost(output)}
              onRunAgent={
                stage.state === 'ready' && runningAgent === null
                  ? () => handleRunAgent(stage.number)
                  : undefined
              }
              onApprove={
                stage.state === 'review' && stage.number === 5
                  ? handleCompleteSession
                  : stage.state === 'review' && stage.number >= 3
                    ? () => handleApproveStage(stage.number)
                    : undefined
              }
              onViewOutput={
                output ? () => toggleOutput(stage.number) : undefined
              }
            >
              {/* Agent 1 Review: No prospects fallback */}
              {stage.number === 1 && stage.state === 'review' && prospects.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    No prospects were found. Try adjusting your query and re-running Agent 1.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunAgent(1)}
                    disabled={runningAgent !== null}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Re-run Agent 1
                  </Button>
                </div>
              )}

              {/* Agent 1 Review: Prospect Selector */}
              {stage.number === 1 && stage.state === 'review' && prospects.length > 0 && (
                <ProspectSelector
                  prospects={prospects}
                  selectedIds={selectedProspectIds}
                  onSelectionChange={setSelectedProspectIds}
                  onApproveSelection={handleApproveProspects}
                  doNotTargetIds={doNotTargetIds}
                  onDoNotTarget={(id) => {
                    setDoNotTargetIds(prev =>
                      prev.includes(id)
                        ? prev.filter(x => x !== id)
                        : [...prev, id]
                    );
                    setSelectedProspectIds(prev => prev.filter(x => x !== id));
                  }}
                />
              )}

              {/* Agent 2 Review: No bookings fallback */}
              {stage.number === 2 && stage.state === 'review' && bookings.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    No booked meetings found. Re-run Agent 2 or skip to Sales Engineer.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunAgent(2)}
                      disabled={runningAgent !== null}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Re-run Agent 2
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveBookingSelection([])}
                      disabled={saving}
                    >
                      Skip & Advance
                    </Button>
                  </div>
                </div>
              )}

              {/* Agent 2 Review: Booking Selector */}
              {stage.number === 2 && stage.state === 'review' && bookings.length > 0 && (
                <BookingSelector
                  bookings={bookings}
                  selectedIds={selectedBookingIds}
                  onSelectionChange={setSelectedBookingIds}
                  onApproveSelection={handleApproveBookings}
                />
              )}

              {/* Agent 3+ Review: Simple approve */}
              {stage.number >= 3 && stage.state === 'review' && (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    Review the output above and approve to advance to the next stage.
                  </p>
                  <Button
                    onClick={() => {
                      if (stage.number === 5) {
                        handleCompleteSession();
                      } else {
                        handleApproveStage(stage.number);
                      }
                    }}
                    disabled={saving}
                  >
                    {stage.number === 5 ? 'Complete Session' : `Approve & Unlock Stage ${stage.number + 1}`}
                  </Button>
                </div>
              )}

              {/* Output viewer */}
              {output != null && (
                <AgentOutputViewer
                  agentId={stage.number}
                  output={output}
                  isOpen={expandedOutputs.has(stage.number)}
                  onToggle={() => toggleOutput(stage.number)}
                />
              )}
            </StageCard>
          );
        })}
      </div>
    </div>
  );
}

// Helper: get agent output from session
function getOutput(session: { agent1Output: unknown; agent2Output: unknown; agent3Output: unknown; agent4Output: unknown; agent5Output: unknown }, agentId: number): unknown {
  const outputs: Record<number, unknown> = {
    1: session.agent1Output,
    2: session.agent2Output,
    3: session.agent3Output,
    4: session.agent4Output,
    5: session.agent5Output,
  };
  return outputs[agentId] ?? null;
}

// Helper: extract cost from agent output if available
function getAgentCost(output: unknown): number | undefined {
  if (!output || typeof output !== 'object') return undefined;
  const o = output as Record<string, unknown>;
  if (typeof o.metadata === 'object' && o.metadata !== null) {
    const meta = o.metadata as Record<string, unknown>;
    if (typeof meta.cost === 'number') return meta.cost;
  }
  return undefined;
}

// Simple booking selector for Stage 2 → 3 gate
function BookingSelector({
  bookings,
  selectedIds,
  onSelectionChange,
  onApproveSelection,
}: {
  bookings: Array<{ id: string; name: string; company: string; status: string }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onApproveSelection: () => void;
}) {
  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
      <h4 className="text-sm font-medium mb-3">
        Select booked meetings to advance to Sales Engineer
      </h4>
      <div className="space-y-2 mb-4">
        {bookings.map(booking => (
          <label
            key={booking.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(booking.id)}
              onChange={() => toggleOne(booking.id)}
              className="rounded"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{booking.name}</span>
              <span className="text-xs text-zinc-500 ml-2">{booking.company}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{booking.status}</Badge>
          </label>
        ))}
      </div>
      <Button
        onClick={onApproveSelection}
        disabled={selectedIds.length === 0}
      >
        Approve Selected ({selectedIds.length}) & Run Discovery
      </Button>
    </div>
  );
}
