/**
 * UptimizeAI Agent 6 — Closer & Onboarding Coordinator
 *
 * Position: Between Agent 3 (Diagnose) and Agent 4 (Build).
 * Architecture: Sequential sub-agents (6A → 6B).
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Agent 6)
 * Source: UPTIMIZE_CLAUDE_CODE_MASTER_V2.md (Sprint 10)
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runPresentationCoach } from './subagents/6a-presentation-coach';
import { runContractOrchestrator } from './subagents/6b-contract-orchestrator';
import type {
  Agent6Input,
  CloseAndOnboardingOutput,
  PresentationCoachResult,
  ContractOrchestratorResult,
} from './types';

export const AGENT_6_SYSTEM_PROMPT = `You are the Closer & Onboarding Coordinator for Uptimize AI — an agentic operations and
growth infrastructure company based in Ponce, Puerto Rico.

YOUR IDENTITY:
You are the bridge between diagnosis and delivery. Agent 3 found the problems and wrote
the proposal. Agent 4 will build the solution. You are the agent that turns a signed
Money Leak Map into a signed contract with provisioned credentials and a client who
knows exactly what to expect. When you fail, deals die on the table. When you succeed,
the build begins with clarity on both sides.

YOUR MISSION:
Guide every qualified prospect from "we found your problem" to "we're ready to build your
solution" — with a signed contract, collected credentials, and a complete briefing for
Agent 4 that reflects what was actually agreed, not just what was proposed.

You operate in two modes:
PRE-CLOSE: Prepare Pedro for the presentation. Coach him on sequence, numbers, objections.
POST-CLOSE: Once Pedro logs the outcome, execute on what was agreed — SOW, credentials,
portal setup, kickoff scheduling, and the complete briefing for Agent 4.

THE CLOSE PHILOSOPHY:
One number first. The monthly leak total is the anchor.
Assumptions get challenged. When a client challenges an estimate, recalculate with their number.
The proposal is not a document. It is a conversation. The three tiers give the client agency.

WHAT YOU NEVER DO:
- Never use pressure tactics, artificial urgency, or scarcity framing.
- Never promise features, timelines, or outcomes that weren't in the proposal.
- Never send the SOW without first confirming the agreed scope with Pedro.
- Never mark credentials as collected until connection tests pass.
- Never brief Agent 4 with the original Agent 3 spec without checking for modifications.
- Never let the build begin before the contract is signed.`;

const TOTAL_TIMEOUT_MS = 120_000;
const TIME_SPLIT_A = 0.45; // 6A: presentation coach
const TIME_SPLIT_B = 0.55; // 6B: contract orchestrator

export interface Agent6Config {
  mode?: 'fast' | 'balanced' | 'quality';
  pipelineRunId?: string;
  memoryEntries?: Record<string, string>;
}

/**
 * Run Agent 6 (Closer) — orchestrates 6A and 6B.
 */
export async function runAgent6Closer(
  input: Agent6Input,
  config: Agent6Config = {},
): Promise<AgentSynthesisResult<CloseAndOnboardingOutput>> {
  const mode = config.mode ?? 'quality';

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-6-closer',
    subAgentId: '6A-presentation-coach',
    clientId: input.client_id,
    pipelineRunId: config.pipelineRunId,
    pipelineSessionId: input.pipeline_session_id,
    task: input.mode === 'pre_close'
      ? 'Generate the pre-presentation guide for Pedro'
      : 'Capture post-presentation debrief and execute the close (SOW, credentials, portal, briefing)',
    taskProfile: 'presentation_coaching',
    mode,
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent6_input: input },
    memoryEntries: config.memoryEntries ?? {},
    maxResponseTokens: 4000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    PresentationCoachResult,
    ContractOrchestratorResult,
    CloseAndOnboardingOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: TIME_SPLIT_A,
    timeSplitB: TIME_SPLIT_B,
    runA: (ctx) => runPresentationCoach({ ...ctx, sub_agent_id: '6A-presentation-coach' }),
    runB: (ctx, _aResult) =>
      runContractOrchestrator(
        { ...ctx, sub_agent_id: '6B-contract-orchestrator', task_profile: 'sow_generation' },
        _aResult,
      ),
    synthesize: (a, b): CloseAndOnboardingOutput => synthesize(input, a, b),
  });

  const subAgentResults = [resultA, resultB];
  const totalCost = subAgentResults.reduce((sum, r) => sum + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((sum, r) => sum + r.duration_ms, 0);
  const escalations = output.escalations;
  const requiresHumanAttention = escalations.length > 0 || subAgentResults.some(r => r.escalation_needed);

  return {
    agent_id: 'agent-6-closer',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Mode: ${input.mode}`,
      output.ready_for_build ? 'Ready for build — Agent 4 briefing assembled' : 'Not yet ready for build',
      ...(escalations.length > 0 ? [`${escalations.length} escalation(s) raised`] : []),
    ],
    overall_confidence: lowestConfidence(subAgentResults),
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? [
          ...escalations.map(e => `[${e.severity}] ${e.reason}`),
          ...subAgentResults.filter(r => r.escalation_needed && r.escalation_reason).map(r => `[${r.escalation_severity}] ${r.escalation_reason}`),
        ].join('; ')
      : undefined,
  };
}

function synthesize(
  input: Agent6Input,
  a: SubAgentResult<PresentationCoachResult>,
  b: SubAgentResult<ContractOrchestratorResult>,
): CloseAndOnboardingOutput {
  const escalations: CloseAndOnboardingOutput['escalations'] = [];

  if (a.escalation_needed && a.escalation_severity) {
    escalations.push({ severity: a.escalation_severity, reason: a.escalation_reason ?? 'Sub-agent 6A escalation' });
  }
  if (b.escalation_needed && b.escalation_severity) {
    escalations.push({ severity: b.escalation_severity, reason: b.escalation_reason ?? 'Sub-agent 6B escalation' });
  }

  const aResult = a.result;
  const bResult = b.result;

  if (!aResult) {
    return {
      mode: input.mode,
      pre_presentation_guide: emptyGuide(input),
      post_presentation_debrief: null,
      contract_status: null,
      credential_status: null,
      client_setup: null,
      scope_modifications: [],
      build_directives: [],
      agent_4_briefing: null,
      ready_for_build: false,
      escalations: [
        ...escalations,
        { severity: 'P1', reason: 'Presentation coach did not produce a guide — close cannot proceed' },
      ],
    };
  }

  return {
    mode: input.mode,
    pre_presentation_guide: aResult.pre_presentation_guide,
    post_presentation_debrief: aResult.post_presentation_debrief ?? null,
    contract_status: bResult?.contract_status ?? null,
    credential_status: bResult?.credential_status ?? null,
    client_setup: bResult?.client_setup ?? null,
    scope_modifications: bResult?.scope_modifications ?? [],
    build_directives: bResult?.build_directives ?? [],
    agent_4_briefing: bResult?.agent_4_briefing ?? null,
    ready_for_build: bResult?.ready_for_build ?? false,
    escalations,
  };
}

function emptyGuide(input: Agent6Input): CloseAndOnboardingOutput['pre_presentation_guide'] {
  return {
    opening_statement: '',
    lead_with_this_number_usd: input.close_plan.lead_with_this_number,
    recommended_sequence: [],
    objection_responses: [],
    closing_question: '',
    red_lines: [],
  };
}

function lowestConfidence(results: Array<{ confidence: 'high' | 'medium' | 'low' }>): 'high' | 'medium' | 'low' {
  if (results.some(r => r.confidence === 'low')) return 'low';
  if (results.some(r => r.confidence === 'medium')) return 'medium';
  return 'high';
}
