/**
 * Sub-agent 3B — Proposal Writer
 *
 * Function: Money leak quantification, solution blueprint, proposal SOW, close
 *           plan, follow-up schedule, and Agent 4 handoff spec.
 * NOT responsible for: discovery (3A's domain).
 *
 * Source: Sprint 12.5. Skills: money-leak-quantification, anti-hallucination-protocol.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  ValueCalc,
  SolutionBlueprint,
  ProposalSOW,
  ClosePlan,
  HandoffToAgent4Spec,
} from '../types';
import type { DiscoveryConductorResult, DiscoveryConductorInput } from './3a-discovery-conductor';

const SYSTEM_PROMPT = `You are the Proposal Writer sub-agent for Uptimize Sales Engineering.

YOUR SINGLE FUNCTION:
Take 3A's discovery findings and produce: money leak quantification (value_calc),
solution blueprint, proposal_sow with three tiers, close plan with anticipated
objections, and the handoff_to_agent4_spec for the build phase.

YOU ARE NOT RESPONSIBLE FOR:
- Discovery interviews (3A already produced findings)
- Pre-call briefs or shadow ops mapping (3A)
- Exception library construction (3A)

ANTI-HALLUCINATION PROTOCOL:
Every dollar figure must trace back to a specific shadow ops task or exception
from 3A's findings. Never invent leak amounts. If 3A's findings cannot support a
quantification, report value_calc with confidence="low" and skip that pillar.

MONEY LEAK QUANTIFICATION:
Convert each pillar finding into a monthly USD figure with the formula used and
the assumptions made. Confidence-weight the total.

SOLUTION BLUEPRINT:
Map each finding to a phase 1 deliverable (start now) or phase 2 deliverable
(after proof). No vapor — every blueprint item must connect to a finding.

PROPOSAL SOW:
Three tiers (Starter, Growth, Full System). Starter addresses the highest-leak
pillar. Growth addresses top 3. Full System covers all six.

CLOSE PLAN:
Lead with the single most impactful monthly figure. List 3-5 anticipated
objections with Acknowledge → Reframe → Evidence → Ask responses.

HANDOFF TO AGENT 4:
Specify build_modules, integrations, risks, definition_of_done, top exceptions
to handle, and audit trail fields required.

OUTPUT FORMAT:
Return valid JSON matching ProposalWriterResult. No markdown fences.`;

export interface ProposalWriterResult {
  value_calc: ValueCalc;
  solution_blueprint: SolutionBlueprint;
  proposal_sow: ProposalSOW;
  close_plan: ClosePlan;
  handoff_to_agent4_spec: HandoffToAgent4Spec;
}

interface SubAgentBInputs extends Record<string, unknown> {
  discovery_input: DiscoveryConductorInput;
  sub_agent_a_result?: DiscoveryConductorResult;
}

function buildUserPrompt(discovery: DiscoveryConductorResult): string {
  const lines: string[] = [];
  lines.push(`Vertical: ${discovery.vertical}`);
  lines.push('');
  lines.push('## DISCOVERY FINDINGS FROM 3A');
  lines.push(`Pillar findings (with USD estimates):`);
  for (const f of discovery.pillar_findings) {
    lines.push(`  - ${f.pillar}: $${f.estimated_usd}/month`);
  }
  lines.push('');
  lines.push('Shadow ops map (top invisible tasks):');
  if (discovery.shadow_ops_map?.top_invisible_tasks_ranked) {
    for (const t of discovery.shadow_ops_map.top_invisible_tasks_ranked) {
      lines.push(`  - ${JSON.stringify(t)}`);
    }
  }
  if (discovery.shadow_ops_map?.off_system_channels?.length) {
    lines.push(`Off-system channels: ${discovery.shadow_ops_map.off_system_channels.join(', ')}`);
  }
  lines.push('');
  lines.push(`Exception library (${discovery.exception_library?.top_exceptions_ranked?.length ?? 0} entries):`);
  if (discovery.exception_library?.top_exceptions_ranked) {
    for (const e of discovery.exception_library.top_exceptions_ranked) {
      lines.push(`  - ${JSON.stringify(e)}`);
    }
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Quantify total monthly leak. Build the three-tier proposal. Produce the close plan and Agent 4 handoff.');
  lines.push('Every dollar figure must trace to a specific finding above. Return ONLY valid JSON matching ProposalWriterResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runProposalWriter(
  ctx: SubAgentContext,
  discovery: DiscoveryConductorResult,
): Promise<SubAgentResult<ProposalWriterResult>> {
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(discovery);
    const fallback = await executeWithFallback(
      'proposal_writing',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as ProposalWriterResult;

    return {
      sub_agent_id: '3B-proposal-writer',
      parent_agent_id: 'agent-3-sales-engineer',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used ? [`Fallback used (${fallback.attempts})`] : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<ProposalWriterResult>(
      '3B-proposal-writer',
      'agent-3-sales-engineer',
      `Proposal writer failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
