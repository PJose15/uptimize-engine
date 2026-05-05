/**
 * Agent 8 Background Worker
 *
 * Two trigger modes:
 *   - processLearningQueue() — pulls pending LearningEvents in batches, applies the
 *     three-tier rule, persists AgentLearning records and distribution notices.
 *   - generateWeeklyBrief(weekOf) — assembles the Sunday brief from the last 7 days
 *     of events for Pedro and Agent 13.
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.2 + 11.3)
 */

import { prisma } from '@/lib/prisma';
import { runAgent8IntelligenceKeeper } from './agent';
import {
  getDistributionTargets,
  createDistributionNotices,
} from '@/lib/learning/distribution';
import type {
  Agent8Input,
  IntelligenceKeeperOutput,
  LearningEventView,
  WeeklyIntelligenceBrief,
  LearningType,
} from './types';

const BATCH_SIZE = 20;

function toView(e: {
  id: string; sourceAgentId: string; sourceRunId: string | null; vertical: string;
  learningType: string; key: string; value: string; dataPoints: number;
  confidence: number; significance: string; createdAt: Date;
}): LearningEventView {
  return {
    id: e.id,
    source_agent_id: e.sourceAgentId,
    source_run_id: e.sourceRunId ?? undefined,
    vertical: e.vertical,
    learning_type: e.learningType,
    key: e.key,
    value: e.value,
    data_points: e.dataPoints,
    confidence: e.confidence,
    significance: e.significance,
    created_at: e.createdAt.toISOString(),
  };
}

// ============================================================================
// QUEUE PROCESSING
// ============================================================================

export interface LearningQueueSummary {
  events_pulled: number;
  events_marked_applied: number;
  updates_applied: number;
  pedro_review_count: number;
  cost_usd: number;
  errors: string[];
}

/**
 * Pull pending LearningEvents and process them through Agent 8.
 * Called by event-dispatcher after pipeline events, and by cron periodically.
 */
export async function processLearningQueue(): Promise<LearningQueueSummary> {
  const summary: LearningQueueSummary = {
    events_pulled: 0, events_marked_applied: 0, updates_applied: 0,
    pedro_review_count: 0, cost_usd: 0, errors: [],
  };

  const pending = await prisma.learningEvent.findMany({
    where: { applied: false },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  summary.events_pulled = pending.length;
  if (pending.length === 0) return summary;

  try {
    const synthesis = await runAgent8IntelligenceKeeper({
      events: pending.map(toView),
      triggered_by: 'cron_batch',
    });

    const out = synthesis.final_output;
    summary.cost_usd = synthesis.total_cost_usd;
    summary.updates_applied = out.playbook_updater.updates_applied.length;
    summary.pedro_review_count = out.pedro_review_required.length;

    await persistOutput(out);

    if (out.events_to_mark_applied.length > 0) {
      await prisma.learningEvent.updateMany({
        where: { id: { in: out.events_to_mark_applied } },
        data: { applied: true },
      });
      summary.events_marked_applied = out.events_to_mark_applied.length;
    }
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  }

  return summary;
}

// ============================================================================
// WEEKLY BRIEF
// ============================================================================

export async function generateWeeklyBrief(weekOf: string): Promise<{
  brief: WeeklyIntelligenceBrief | null;
  cost_usd: number;
  error?: string;
}> {
  const weekStart = new Date(weekOf);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const events = await prisma.learningEvent.findMany({
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
    orderBy: { createdAt: 'asc' },
  });

  if (events.length === 0) {
    return { brief: null, cost_usd: 0 };
  }

  try {
    const synthesis = await runAgent8IntelligenceKeeper({
      events: events.map(toView),
      triggered_by: 'weekly_brief',
      weekly_window: { week_of: weekOf },
    });
    return {
      brief: synthesis.final_output.weekly_brief ?? null,
      cost_usd: synthesis.total_cost_usd,
    };
  } catch (err) {
    return {
      brief: null,
      cost_usd: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

async function persistOutput(out: IntelligenceKeeperOutput): Promise<void> {
  for (const update of out.playbook_updater.updates_applied) {
    const evaluation = out.pattern_collector.evaluations[update.evaluation_index];
    if (!evaluation) continue;

    // Upsert AgentLearning row
    const upserted = await prisma.agentLearning.upsert({
      where: {
        vertical_agentId_learningType_key: {
          vertical: evaluation.vertical,
          agentId: 'agent-8-intelligence',
          learningType: String(evaluation.learning_type),
          key: evaluation.key,
        },
      },
      update: {
        value: JSON.stringify({
          old_summary: update.old_content_summary,
          new_summary: update.new_content_summary,
          target: update.target,
        }),
        confidence: update.applied_label === 'VALIDATED' ? 0.9 : 0.65,
        label: update.applied_label === 'VALIDATED' ? 'validated' : 'emerging',
        dataPoints: update.data_points,
      },
      create: {
        vertical: evaluation.vertical,
        agentId: 'agent-8-intelligence',
        learningType: String(evaluation.learning_type),
        key: evaluation.key,
        value: JSON.stringify({
          old_summary: update.old_content_summary,
          new_summary: update.new_content_summary,
          target: update.target,
        }),
        confidence: update.applied_label === 'VALIDATED' ? 0.9 : 0.65,
        label: update.applied_label === 'VALIDATED' ? 'validated' : 'emerging',
        dataPoints: update.data_points,
      },
    });

    update.agent_learning_id = upserted.id;

    // Distribute only validated learnings (per spec)
    if (update.applied_label === 'VALIDATED') {
      const targets = getDistributionTargets(String(evaluation.learning_type), evaluation.key);
      // model_performance must NOT be distributed to other agents — Pedro only
      if (String(evaluation.learning_type) !== 'model_performance' && targets.length > 0) {
        await createDistributionNotices(upserted.id, targets);
      }
    }
  }
}

// ============================================================================
// EVENT-TRIGGERED MICROBATCH
// ============================================================================

/**
 * Triggered by event-dispatcher after a single pipeline agent completion.
 * Processes only events that were just created (by source run), not the full backlog.
 */
export async function processLearningEventsForRun(
  sourceRunId: string,
): Promise<LearningQueueSummary> {
  const summary: LearningQueueSummary = {
    events_pulled: 0, events_marked_applied: 0, updates_applied: 0,
    pedro_review_count: 0, cost_usd: 0, errors: [],
  };

  const pending = await prisma.learningEvent.findMany({
    where: { sourceRunId, applied: false },
    orderBy: { createdAt: 'asc' },
  });

  summary.events_pulled = pending.length;
  if (pending.length === 0) return summary;

  try {
    const synthesis = await runAgent8IntelligenceKeeper({
      events: pending.map(toView),
      triggered_by: 'event',
    });
    const out = synthesis.final_output;
    summary.cost_usd = synthesis.total_cost_usd;
    summary.updates_applied = out.playbook_updater.updates_applied.length;
    summary.pedro_review_count = out.pedro_review_required.length;
    await persistOutput(out);

    if (out.events_to_mark_applied.length > 0) {
      await prisma.learningEvent.updateMany({
        where: { id: { in: out.events_to_mark_applied } },
        data: { applied: true },
      });
      summary.events_marked_applied = out.events_to_mark_applied.length;
    }
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  }

  return summary;
}
