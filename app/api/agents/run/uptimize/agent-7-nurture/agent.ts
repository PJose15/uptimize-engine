/**
 * UptimizeAI Agent 7 — Nurture Intelligence (Parallel: 7A ∥ 7B)
 *
 * Position: Perpetual background — feeds back into Agents 1 and 2.
 * Architecture: Parallel sub-agents.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 7)
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 11.1)
 */

import { runParallel, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runSignalMonitor } from './subagents/7a-signal-monitor';
import { runSequenceManager } from './subagents/7b-sequence-manager';
import type {
  Agent7Input,
  NurtureIntelligenceOutput,
  SignalMonitorResult,
  SequenceManagerResult,
} from './types';

export const AGENT_7_SYSTEM_PROMPT = `You are the Nurture Intelligence Agent for Uptimize AI.

YOUR MISSION:
Manage every prospect who entered the nurture queue, maintain their relationship across
four categories, detect when their situation changes, and reintroduce them to the active
pipeline at exactly the right moment with full context.

THE FOUR NURTURE CATEGORIES:
HOT (14-day cycle): Received a proposal, said "not yet."
WARM (30-day cycle): Qualified, engaged, timing was wrong.
COLD (Quarterly): Early-stage inquiry, minimal engagement.
LOST DEAL (60-day cycle): Said no explicitly. Maximum respect, minimum frequency.

THE RULE OF SPECIFIC REASON:
Every touch must have a reason that could be stated in one sentence.
Generic check-ins are noise. Specific touches are signals.

WHAT YOU NEVER DO:
- Never send a generic "just checking in" message.
- Never contact more frequently than the category schedule allows.
- Never reintroduce without 7A scoring readiness 8+.
- Never bypass the approval queue.`;

const TOTAL_TIMEOUT_MS = 60_000;
const TIME_SHARED_BUDGET = 0.85;

export interface Agent7Config {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
}

export async function runAgent7Nurture(
  input: Agent7Input,
  config: Agent7Config = {},
): Promise<AgentSynthesisResult<NurtureIntelligenceOutput>> {
  const mode = config.mode ?? 'balanced';

  // Learnings distributed to this agent, delivered into sub-agent memory.
  const memory = await loadAgentMemory('agent-7-nurture');

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-7-nurture',
    subAgentId: '7A-signal-monitor',
    clientId: input.client_id,
    pipelineRunId: config.pipelineRunId,
    task: 'Process nurture batch — detect signals, score readiness, draft due touches',
    taskProfile: 'signal_monitoring',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent7_input: input },
    memoryEntries: config.memoryEntries ?? memory.entries,
    maxResponseTokens: 4000,
    confidenceRequired: 'medium',
  });

  const { output, resultA, resultB } = await runParallel<
    SignalMonitorResult,
    SequenceManagerResult,
    NurtureIntelligenceOutput
  >(baseCtx, {
    pattern: 'parallel',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSharedBudget: TIME_SHARED_BUDGET,
    runA: (ctx) => runSignalMonitor({ ...ctx, sub_agent_id: '7A-signal-monitor', task_profile: 'signal_monitoring' }),
    runB: (ctx) => runSequenceManager({ ...ctx, sub_agent_id: '7B-sequence-manager', task_profile: 'sequence_management' }),
    synthesize: (a, b) => synthesize(input, a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: input.client_id, agentId: 'agent-7-nurture' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = Math.max(...subAgentResults.map(r => r.duration_ms));
  const requiresHumanAttention = output.escalations.length > 0 || subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-7-nurture',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Triggered by: ${input.triggered_by}`,
      `Records evaluated: ${input.records.length}`,
      `Reintroductions: ${output.reintroductions.length}`,
      `Approval queue entries: ${output.approval_queue_entries.length}`,
      `Archived: ${output.archived.length}`,
    ],
    overall_confidence: lowestConfidence(subAgentResults),
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? output.escalations.map(e => `[${e.severity}] ${e.reason}`).join('; ')
      : undefined,
  };
}

function synthesize(
  input: Agent7Input,
  a: SubAgentResult<SignalMonitorResult>,
  b: SubAgentResult<SequenceManagerResult>,
): NurtureIntelligenceOutput {
  const escalations: NurtureIntelligenceOutput['escalations'] = [];

  if (a.escalation_needed && a.escalation_severity && a.escalation_severity !== 'P1') {
    escalations.push({ severity: a.escalation_severity, reason: a.escalation_reason ?? '7A escalation' });
  }
  if (b.escalation_needed && b.escalation_severity && b.escalation_severity !== 'P1') {
    escalations.push({ severity: b.escalation_severity, reason: b.escalation_reason ?? '7B escalation' });
  }

  const signalMonitor = a.result ?? {
    assessments: [],
    batch_summary: { records_evaluated: 0, signals_detected: 0, reintroduce_count: 0, soft_touch_count: 0, monitor_count: 0, archive_count: 0 },
  };
  const sequenceManager = b.result ?? {
    touches_due: [],
    records_archived: [],
    records_updated_next_touch: [],
    batch_summary: { records_due: 0, touches_drafted: 0, archived_count: 0, updated_count: 0 },
  };

  // Build reintroductions from 7A assessments scored 8+
  const reintroductions: NurtureIntelligenceOutput['reintroductions'] = signalMonitor.assessments
    .filter(asmt => asmt.recommendation === 'reintroduce_to_pipeline' && asmt.reintroduction_eligible && asmt.re_engagement_readiness >= 8)
    .map(asmt => ({
      nurture_record_id: asmt.nurture_record_id,
      lead_id: asmt.lead_id,
      company: asmt.company,
      vertical: asmt.vertical,
      readiness_score: asmt.re_engagement_readiness,
      requalify_brief: buildRequalifyBrief(asmt, input),
    }));

  // Build approval-queue entries from 7B drafted touches
  const approvalQueue: NurtureIntelligenceOutput['approval_queue_entries'] = sequenceManager.touches_due
    .filter(t => t.specific_reason && t.specific_reason.trim().length > 0) // enforce specific reason rule
    .map(t => ({
      nurture_record_id: t.nurture_record_id,
      drafted_touch: t,
    }));

  // Combine archived from both signals (7A archive recommendation OR 7B archival criteria)
  const archivedById = new Map<string, string>();
  for (const asmt of signalMonitor.assessments) {
    if (asmt.recommendation === 'archive') {
      archivedById.set(asmt.nurture_record_id, asmt.rationale);
    }
  }
  for (const a of sequenceManager.records_archived) {
    archivedById.set(a.nurture_record_id, a.reason);
  }
  const archived = [...archivedById.entries()].map(([id, reason]) => ({ nurture_record_id: id, reason }));

  // Next-touch updates from 7B (excluding archived)
  const nextTouches = sequenceManager.records_updated_next_touch
    .filter(u => !archivedById.has(u.nurture_record_id))
    .map(u => ({ nurture_record_id: u.nurture_record_id, new_next_touch: u.new_next_touch }));

  // P2 escalations: reintroduction without specific signal
  for (const r of reintroductions) {
    const asmt = signalMonitor.assessments.find(a => a.nurture_record_id === r.nurture_record_id);
    if (!asmt || asmt.signals_observed.length === 0) {
      escalations.push({
        severity: 'P2',
        nurture_record_id: r.nurture_record_id,
        reason: 'Marked for reintroduction but no signals observed — review before sending to Agent 1',
      });
    }
  }

  return {
    signal_monitor: signalMonitor,
    sequence_manager: sequenceManager,
    reintroductions,
    approval_queue_entries: approvalQueue,
    archived,
    next_touches_updated: nextTouches,
    escalations,
  };
}

function buildRequalifyBrief(
  asmt: NonNullable<SignalMonitorResult['assessments'][number]>,
  input: Agent7Input,
): string {
  const record = input.records.find(r => r.id === asmt.nurture_record_id);
  if (!record) {
    return `${asmt.company} (${asmt.vertical}): readiness ${asmt.re_engagement_readiness}/10. ${asmt.rationale}`;
  }
  const topSignal = asmt.signals_observed[0];
  const signalSummary = topSignal ? `Signal: [${topSignal.kind}] ${topSignal.description}` : 'Signal: (composite)';
  return [
    `${asmt.company} (${asmt.vertical}, was nurture-${asmt.category})`,
    `Original pain: ${record.originalPain}`,
    `Reason left pipeline: ${record.reason}`,
    signalSummary,
    `Readiness ${asmt.re_engagement_readiness}/10 — ${asmt.rationale}`,
    `Last contact: ${record.daysSinceLastContact} days ago.`,
  ].join(' | ');
}

function lowestConfidence(results: Array<{ confidence: 'high' | 'medium' | 'low' }>): 'high' | 'medium' | 'low' {
  if (results.some(r => r.confidence === 'low')) return 'low';
  if (results.some(r => r.confidence === 'medium')) return 'medium';
  return 'high';
}
