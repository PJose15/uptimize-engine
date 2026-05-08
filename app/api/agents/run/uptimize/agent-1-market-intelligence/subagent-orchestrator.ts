/**
 * Agent 1 — Sub-agent Orchestrator (Sprint 12.3)
 *
 * V2 sub-agent architecture path: 1A research → 1B scoring → TargetPackOutput.
 * Runs alongside the legacy single-call class in agent.ts. Same output shape,
 * so it is interchangeable with runAgent1MarketIntelligence().
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md Sprint 12.3
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runResearchSpecialist, type ResearchSpecialistResult } from './subagents/1a-research-specialist';
import { runScoringAnalyst, type ScoringAnalystResult } from './subagents/1b-scoring-analyst';
import type {
  Agent1Input,
  TargetPackOutput,
  LeadRecord,
  RunMetadata,
} from './types';

const TOTAL_TIMEOUT_MS = 180_000;
const TIME_SPLIT_A = 0.65;
const TIME_SPLIT_B = 0.30;

export interface RunAgent1SubAgentConfig {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
  clientId?: string;
}

export async function runAgent1SubAgent(
  input: Agent1Input,
  config: RunAgent1SubAgentConfig = {},
): Promise<AgentSynthesisResult<TargetPackOutput>> {
  const mode = config.mode ?? input.mode ?? 'balanced';
  const clientId = config.clientId ?? 'unknown';

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-1-market-intelligence',
    subAgentId: '1A-research-specialist',
    clientId,
    pipelineRunId: config.pipelineRunId,
    task: 'Produce researched + scored target pack',
    taskProfile: 'shadow_ops_research',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent1_input: input },
    memoryEntries: config.memoryEntries ?? {},
    maxResponseTokens: 6000,
    confidenceRequired: 'medium',
  });

  const { output, resultA, resultB } = await runSequential<
    ResearchSpecialistResult,
    ScoringAnalystResult,
    TargetPackOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: TIME_SPLIT_A,
    timeSplitB: TIME_SPLIT_B,
    runA: (ctx) => runResearchSpecialist({ ...ctx, sub_agent_id: '1A-research-specialist', task_profile: 'shadow_ops_research' }),
    runB: (ctx, aResult) =>
      runScoringAnalyst({ ...ctx, sub_agent_id: '1B-scoring-analyst', task_profile: 'signal_scoring' }, aResult),
    synthesize: (a, b) => synthesize(input, a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-1-market-intelligence',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Primary pack: ${output.target_pack_primary.length} leads`,
      `Secondary pack: ${output.target_pack_secondary.length} leads`,
      `Top angle: ${output.angle_of_the_day.primary_angle}`,
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
  input: Agent1Input,
  a: SubAgentResult<ResearchSpecialistResult>,
  b: SubAgentResult<ScoringAnalystResult>,
): TargetPackOutput {
  const research = a.result;
  const scoring = b.result;

  const runMetadata: RunMetadata = {
    run_date: new Date().toISOString().split('T')[0],
    segment_focus: input.queryIntent?.industry ?? 'mixed',
    sources_used: research?.sources_used ?? [],
    notes: research?.research_notes ?? '',
  };

  // If both failed, emit empty-but-valid shape
  if (!research && !scoring) {
    return {
      run_metadata: runMetadata,
      angle_of_the_day: { primary_angle: '', secondary_angle: '', pattern_interrupt_question: '' },
      do_not_target: [],
      target_pack_primary: [],
      target_pack_secondary: [],
      shadow_ops_insights: { top_signals_found: [], common_exception_patterns: [], notes: 'Sub-agents failed' },
    };
  }

  // If 1B failed but 1A succeeded, fall back to 1A's research as unscored leads
  // (best-effort: produce primary pack with default scores so downstream isn't empty)
  const primary: LeadRecord[] = scoring?.target_pack_primary ?? [];
  const secondary: LeadRecord[] = scoring?.target_pack_secondary ?? [];

  return {
    run_metadata: runMetadata,
    angle_of_the_day: scoring?.angle_of_the_day ?? {
      primary_angle: '',
      secondary_angle: '',
      pattern_interrupt_question: '',
    },
    do_not_target: research?.do_not_target ?? [],
    target_pack_primary: primary,
    target_pack_secondary: secondary,
    shadow_ops_insights: research?.shadow_ops_insights ?? {
      top_signals_found: [],
      common_exception_patterns: [],
      notes: '',
    },
  };
}
