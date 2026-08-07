/**
 * Agent 2 — Sub-agent Orchestrator (Sprint 12.6)
 *
 * V2 sub-agent architecture: 2A message architect ∥ 2B pipeline manager (parallel).
 * After 2B completes, fires onAgent2NurtureQueue() for any nurture entries to
 * create NurtureRecord rows for Agent 7.
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md Sprint 12.6
 */

import { runParallel, buildSubAgentContext } from '@/lib/subagent';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runMessageArchitect, type MessageArchitectResult, type MessageArchitectInput } from './subagents/2a-message-architect';
import { runPipelineManager, type PipelineManagerResult } from './subagents/2b-pipeline-manager';
import type { OutboundAndBookingOutput } from './types';

const TOTAL_TIMEOUT_MS = 180_000;
const TIME_SHARED_BUDGET = 0.80;

export interface RunAgent2SubAgentConfig {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
  clientId?: string;
  vertical?: string;
}

export async function runAgent2SubAgent(
  input: MessageArchitectInput,
  config: RunAgent2SubAgentConfig = {},
): Promise<AgentSynthesisResult<OutboundAndBookingOutput>> {
  const mode = config.mode ?? 'balanced';
  const clientId = config.clientId ?? 'unknown';

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-2-outbound-appointment',
    subAgentId: '2A-message-architect',
    clientId,
    pipelineRunId: config.pipelineRunId,
    task: 'Produce outreach plan — message library and pipeline state in parallel',
    taskProfile: 'content_drafting',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent2_input: input },
    memoryEntries: config.memoryEntries ?? {},
    maxResponseTokens: 6000,
    confidenceRequired: 'medium',
  });

  const { output, resultA, resultB } = await runParallel<
    MessageArchitectResult,
    PipelineManagerResult,
    OutboundAndBookingOutput
  >(baseCtx, {
    pattern: 'parallel',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSharedBudget: TIME_SHARED_BUDGET,
    runA: (ctx) => runMessageArchitect({ ...ctx, sub_agent_id: '2A-message-architect', task_profile: 'content_drafting' }),
    runB: (ctx) => runPipelineManager({ ...ctx, sub_agent_id: '2B-pipeline-manager', task_profile: 'pipeline_stage_mgmt' }),
    synthesize: (a, b) => synthesize(a, b),
  });

  // Per Sprint 12.6 spec: "After 2B completes, trigger onAgent2NurtureQueue()
  // for any nurture queue entries."
  //
  // Dispatched by the caller rather than here. NurtureEntry carries only
  // (lead_id, reason, next_touch_day_offset, nurture_message, shadow_ops_guess,
  // likely_exceptions_guess) — the company / contactName / vertical that
  // NurtureRecord needs live in Agent 1's target pack, which this orchestrator
  // sees only as an opaque `target_pack` input. lib/learning/nurture-entries.ts
  // performs the join at the layer holding both, and the pipeline route calls
  // it once per run. Dispatching here as well would double-write the records.

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = Math.max(...subAgentResults.map(r => r.duration_ms));
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-2-outbound-appointment',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Message library: ${output.message_library.length}`,
      `Bookings: ${output.bookings.length}`,
      `Nurture queue: ${output.nurture_queue.length}`,
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low'
      : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? subAgentResults.filter(r => r.escalation_needed).map(r => r.escalation_reason).filter(Boolean).join('; ') || undefined
      : undefined,
  };
}

function synthesize(
  a: SubAgentResult<MessageArchitectResult>,
  b: SubAgentResult<PipelineManagerResult>,
): OutboundAndBookingOutput {
  const messages = a.result;
  const pipeline = b.result;

  return {
    run_metadata: {
      run_date: new Date().toISOString().split('T')[0],
      timezone: 'America/Puerto_Rico',
      channels_used: pipeline?.channels_used ?? [],
      volume_targets: pipeline?.volume_targets ?? { new_outreach: 0, followups: 0, goal_booked_calls: 0 },
      notes: '',
    },
    outbound_run_sheet: pipeline?.outbound_run_sheet ?? {
      daily_plan: [], sequence_rules: '', qualification_rules: '', no_show_protocol: '',
    },
    message_library: messages?.message_library ?? [],
    conversation_updates: messages?.conversation_updates ?? [],
    bookings: pipeline?.bookings ?? [],
    nurture_queue: pipeline?.nurture_queue ?? [],
  };
}
