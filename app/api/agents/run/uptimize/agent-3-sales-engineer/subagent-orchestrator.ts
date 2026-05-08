/**
 * Agent 3 — Sub-agent Orchestrator (Sprint 12.5)
 *
 * V2 sub-agent architecture: 3A discovery → [Agent 8 learning collector hook] → 3B proposal.
 *
 * Per spec: "After 3A completes, trigger the Agent 8 learning event dispatch
 * BEFORE 3B runs. 3A's findings are the learning signal, not 3B's proposal."
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md Sprint 12.5
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { collectFromAgent3 } from '@/lib/learning/collectors/from-agent3';
import {
  runDiscoveryConductor,
  type DiscoveryConductorResult,
  type DiscoveryConductorInput,
} from './subagents/3a-discovery-conductor';
import { runProposalWriter, type ProposalWriterResult } from './subagents/3b-proposal-writer';
import type { Agent3Output } from './types';

const TOTAL_TIMEOUT_MS = 240_000;
const TIME_SPLIT_A = 0.65;
const TIME_SPLIT_B = 0.30;

export interface RunAgent3SubAgentConfig {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
  clientId?: string;
}

export async function runAgent3SubAgent(
  input: DiscoveryConductorInput,
  config: RunAgent3SubAgentConfig = {},
): Promise<AgentSynthesisResult<Agent3Output>> {
  const mode = config.mode ?? 'balanced';
  const clientId = config.clientId ?? 'unknown';

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-3-sales-engineer',
    subAgentId: '3A-discovery-conductor',
    clientId,
    pipelineRunId: config.pipelineRunId,
    task: 'Discovery → learning collection → proposal',
    taskProfile: 'discovery_audit',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { discovery_input: input },
    memoryEntries: config.memoryEntries ?? {},
    maxResponseTokens: 6000,
    confidenceRequired: 'high',
  });

  // Note: we cannot use runSequential as-is because the spec requires firing
  // collectFromAgent3() between 3A and 3B. Implement the sequential flow
  // manually so we can inject the learning hook at the correct boundary.
  const ctxA = { ...baseCtx, time_budget_ms: Math.floor(TOTAL_TIMEOUT_MS * TIME_SPLIT_A) };
  const resultA = await runDiscoveryConductor(ctxA);

  // Fire the learning collector BEFORE 3B runs — best-effort, don't block on errors.
  if (resultA.task_completed && resultA.result && config.pipelineRunId) {
    try {
      await collectFromAgent3(
        {
          vertical: resultA.result.vertical,
          pillar_findings: resultA.result.pillar_findings,
          new_exceptions: resultA.result.new_exceptions,
        },
        config.pipelineRunId,
      );
    } catch (err) {
      console.error('[agent-3 sub-agent orchestrator] collectFromAgent3 failed:', err);
    }
  }

  let resultB: SubAgentResult<ProposalWriterResult>;
  if (!resultA.task_completed || !resultA.result) {
    // Skip 3B if 3A failed (proposal needs discovery findings)
    resultB = {
      sub_agent_id: '3B-proposal-writer',
      parent_agent_id: 'agent-3-sales-engineer',
      task_completed: false,
      result: null,
      confidence: 'low',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['Skipped — discovery (3A) did not complete'],
      fallbacks_used: [],
      escalation_needed: true,
      escalation_severity: 'P1',
      escalation_reason: 'Cannot generate proposal without discovery findings',
    };
  } else {
    const ctxB = {
      ...baseCtx,
      sub_agent_id: '3B-proposal-writer' as const,
      task_profile: 'proposal_writing' as const,
      time_budget_ms: Math.floor(TOTAL_TIMEOUT_MS * TIME_SPLIT_B),
      inputs: { ...baseCtx.inputs, sub_agent_a_result: resultA.result },
    };
    resultB = await runProposalWriter(ctxB, resultA.result);
  }

  const output = synthesize(resultA, resultB);
  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-3-sales-engineer',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Pillar findings: ${resultA.result?.pillar_findings.length ?? 0}`,
      `Monthly value estimate: $${output.value_calc?.monthly_value_estimate ?? 0}`,
      `Proposal tiers: ${output.proposal_sow?.pricing_options?.length ?? 0}`,
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
  a: SubAgentResult<DiscoveryConductorResult>,
  b: SubAgentResult<ProposalWriterResult>,
): Agent3Output {
  const discovery = a.result;
  const proposal = b.result;

  const emptyPhase = { goal: '', deliverables: [], leaks_addressed: [], time_to_value: '', dependencies: [] };

  return {
    pre_call_brief: discovery?.pre_call_brief ?? {
      lead_id: '',
      hypotheses: [],
      must_answer_questions: [],
      meeting_goal: '',
    },
    discovery_notes_structured: discovery?.discovery_notes_structured ?? {
      current_process_map: [],
      leaks: [],
      impact: { time_cost: '', revenue_cost: '', quality_cost: '' },
      success_criteria: [],
      constraints: [],
      decision_process: { decision_maker: '', stakeholders: [], budget_range_known: false, timeline: '', procurement_notes: '' },
    },
    shadow_ops_map: discovery?.shadow_ops_map ?? {
      top_invisible_tasks_ranked: [],
      off_system_channels: [],
      context_loss_points: [],
      audit_gaps: [],
    },
    exception_library: discovery?.exception_library ?? {
      top_exceptions_ranked: [],
      exception_metrics_assumptions: [],
      exceptions_to_productize: [],
    },
    value_calc: proposal?.value_calc ?? {
      dollar_value_summary: '',
      assumptions: [],
      time_saved_per_week_hours: 0,
      cost_per_hour_assumption: 0,
      monthly_value_estimate: 0,
      notes: 'Sub-agent failed',
    },
    solution_blueprint: proposal?.solution_blueprint ?? {
      phase_1: emptyPhase,
      phase_2: emptyPhase,
      phase_3_optional: emptyPhase,
      kpis_to_track: [],
    },
    proposal_sow: proposal?.proposal_sow ?? {
      summary: '',
      deliverables: [],
      timeline: '',
      pricing_options: [],
      client_responsibilities: [],
      assumptions_exclusions: [],
      change_request_process: '',
      acceptance_criteria: [],
      exception_paths_committed: [],
      audit_trail_commitment: [],
    },
    close_plan: proposal?.close_plan ?? {
      primary_objections_expected: [],
      responses: [],
      next_steps: [],
      follow_up_schedule: [],
    },
    handoff_to_agent4_spec: proposal?.handoff_to_agent4_spec ?? {
      build_modules: [],
      integrations: [],
      agent_specs_needed: [],
      risks: [],
      definition_of_done: [],
      top_exceptions_to_handle: [],
      audit_trail_fields_required: [],
    },
  };
}
