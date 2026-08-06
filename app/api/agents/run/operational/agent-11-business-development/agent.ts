/**
 * Agent 11 — Business Development & Pipeline (Parallel: 11A ∥ 11B)
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 11)
 */

import { runParallel, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runProspectResearch } from './subagents/11a-prospect-research';
import { runBdPipelineManager } from './subagents/11b-pipeline-manager';
import type {
  Agent11Input,
  BusinessDevelopmentOutput,
  ProspectResearchResult,
  PipelineStageManagerResult,
} from './types';

export const AGENT_11_SYSTEM_PROMPT = `You are the Business Development & Pipeline Agent for Uptimize AI.

WHAT YOU NEVER DO:
- Never let a warm referral go uncontacted for more than 48 hours.
- Never present a BD prospect as qualified without 11A's research brief.
- Never confuse the BD pipeline with the client delivery pipeline.`;

const TOTAL_TIMEOUT_MS = 90_000;
const TIME_SHARED_BUDGET = 0.85;

export async function runAgent11BusinessDevelopment(
  input: Agent11Input,
  config: { mode?: 'fast' | 'balanced' | 'quality' } = {},
): Promise<AgentSynthesisResult<BusinessDevelopmentOutput>> {
  // Learnings distributed to this agent, delivered into sub-agent memory.
  const memory = await loadAgentMemory('agent-11-business-development');

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-11-business-development',
    subAgentId: '11A-prospect-research',
    clientId: 'system',
    task: 'BD pipeline management + prospect research',
    taskProfile: 'prospect_research',
    mode: config.mode ?? 'balanced',
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent11_input: input },
    memoryEntries: memory.entries,
    maxResponseTokens: 5000,
    confidenceRequired: 'medium',
  });

  const { output, resultA, resultB } = await runParallel<
    ProspectResearchResult,
    PipelineStageManagerResult,
    BusinessDevelopmentOutput
  >(baseCtx, {
    pattern: 'parallel',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSharedBudget: TIME_SHARED_BUDGET,
    runA: (ctx) => runProspectResearch({ ...ctx, sub_agent_id: '11A-prospect-research', task_profile: 'prospect_research' }),
    runB: (ctx) => runBdPipelineManager({ ...ctx, sub_agent_id: '11B-pipeline-manager-bd', task_profile: 'pipeline_stage_mgmt' }),
    synthesize: (a, b) => synthesize(a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-11-business-development' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = Math.max(...subAgentResults.map(r => r.duration_ms));
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-11-business-development',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Records: ${output.pipeline.records.length}`,
      `Stalled: ${output.pipeline.stalled.length}`,
      `New referrals: ${output.pipeline.new_referrals.length}`,
      `Pipeline value: $${output.daily_digest.pipeline_value_usd}`,
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low' : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? subAgentResults.filter(r => r.escalation_needed).map(r => r.escalation_reason).filter(Boolean).join('; ') || undefined
      : undefined,
  };
}

function synthesize(
  a: SubAgentResult<ProspectResearchResult>,
  b: SubAgentResult<PipelineStageManagerResult>,
): BusinessDevelopmentOutput {
  const research = a.result ?? { briefs: [], research_missing_for: [] };
  const pipeline = b.result ?? {
    records: [], actions_today: [], stalled: [], new_referrals: [], partnerships_in_progress: [],
    weekly_metrics: { calls_booked: 0, proposals_in_close: 0, referrals_active: 0, pipeline_value_usd: 0 },
  };

  return {
    research,
    pipeline,
    daily_digest: {
      actions_today: pipeline.actions_today,
      stalled_count: pipeline.stalled.length,
      new_referrals_count: pipeline.new_referrals.length,
      pipeline_value_usd: pipeline.weekly_metrics.pipeline_value_usd,
    },
    generated_at: new Date().toISOString(),
  };
}
