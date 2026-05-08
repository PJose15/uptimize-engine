/**
 * Agent 4 — Sub-agent Orchestrator (Sprint 12.4)
 *
 * V2 sub-agent architecture: 4A spec design → 4B QA engineering → DeliveryPackageOutput.
 *
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md Sprint 12.4
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runSpecDesigner, type SpecDesignerResult, type SpecDesignerInput } from './subagents/4a-spec-designer';
import { runQaEngineer, type QaEngineerResult } from './subagents/4b-qa-engineer';
import type { DeliveryPackageOutput } from './types';

const TOTAL_TIMEOUT_MS = 180_000;
const TIME_SPLIT_A = 0.60;
const TIME_SPLIT_B = 0.35;

export interface RunAgent4SubAgentConfig {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
  clientId?: string;
}

export async function runAgent4SubAgent(
  input: SpecDesignerInput,
  config: RunAgent4SubAgentConfig = {},
): Promise<AgentSynthesisResult<DeliveryPackageOutput>> {
  const mode = config.mode ?? 'balanced';
  const clientId = config.clientId ?? 'unknown';

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-4-systems-builder',
    subAgentId: '4A-spec-designer',
    clientId,
    pipelineRunId: config.pipelineRunId,
    task: 'Produce delivery package — spec then QA',
    taskProfile: 'discovery_audit',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { spec_designer_input: input },
    memoryEntries: config.memoryEntries ?? {},
    maxResponseTokens: 6000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    SpecDesignerResult,
    QaEngineerResult,
    DeliveryPackageOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: TIME_SPLIT_A,
    timeSplitB: TIME_SPLIT_B,
    runA: (ctx) => runSpecDesigner({ ...ctx, sub_agent_id: '4A-spec-designer' }),
    runB: (ctx, aResult) => runQaEngineer({ ...ctx, sub_agent_id: '4B-qa-engineer' }, aResult),
    synthesize: (a, b) => synthesize(a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = subAgentResults.some(r => r.escalation_needed);

  const goNoGo = resultB.result?.go_no_go ?? 'NO_GO';

  return {
    agent_id: 'agent-4-systems-builder',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Workflows: ${output.workflow_specs.length}`,
      `Agent specs: ${output.agent_spec_sheets.length}`,
      `Decision: ${goNoGo}`,
      ...(resultB.result?.blockers.length ? [`Blockers: ${resultB.result.blockers.length}`] : []),
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
  a: SubAgentResult<SpecDesignerResult>,
  b: SubAgentResult<QaEngineerResult>,
): DeliveryPackageOutput {
  const spec = a.result;
  const qa = b.result;

  return {
    build_plan: spec?.build_plan ?? emptyBuildPlan(),
    data_model: spec?.data_model ?? { entities: [], fields: [], logging_fields: [], pipeline_stages: [], exception_tags: [] },
    workflow_specs: spec?.workflow_specs ?? [],
    agent_spec_sheets: spec?.agent_spec_sheets ?? [],
    qa_plan_and_results: qa?.qa_plan_and_results ?? { qa_checklist: [], test_cases: [], results_summary: 'Sub-agent failed', open_issues: ['QA sub-agent did not complete'] },
    fallback_modes: spec?.fallback_modes ?? [],
    client_handoff_kit: qa?.client_handoff_kit ?? { quickstart_5min: [], daily_sop: [], weekly_sop: [], exception_sop: [], training_plan: [], admin_notes: [] },
    post_launch_monitoring: qa?.post_launch_monitoring ?? { kpis: [], alerts: [], support_process: [], weekly_review_format: [] },
    audit_trail_spec: spec?.audit_trail_spec ?? { audit_fields: [], audit_event_types: [], retention_policy: '', where_logs_live: '' },
  };
}

function emptyBuildPlan() {
  const phase = { goal: '', deliverables: [], time_to_value: '', dependencies: [] };
  return {
    phase_1: phase,
    phase_2_optional: phase,
    milestones: [],
    dependencies: [],
    change_request_linkage: '',
  };
}
