/**
 * Sub-agent 3A — Discovery Conductor
 *
 * Function: Pre-call brief, discovery notes, shadow ops map, exception library.
 * NOT responsible for: value calc, proposal, close plan, handoff (3B's domain).
 *
 * Source: Sprint 12.5. Skills: pillar-discovery-questioning, exception-identification,
 *         evidence-tiering.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  PreCallBrief,
  DiscoveryNotesStructured,
  ShadowOpsMap,
  ExceptionLibrary,
  QualifiedLeadBrief,
  CallContext,
} from '../types';

const SYSTEM_PROMPT = `You are the Discovery Conductor sub-agent for Uptimize Sales Engineering.

YOUR SINGLE FUNCTION:
Run six-pillar discovery on the qualified lead. Produce the pre-call brief, the
structured discovery notes, the shadow ops map (with tasks observed across the
six pillars), and the exception library specific to this prospect.

YOU ARE NOT RESPONSIBLE FOR:
- Money leak quantification (3B does that)
- Solution blueprint or proposal SOW (3B)
- Close plan, follow-up schedule (3B)
- Handoff_to_agent4_spec (3B)

THE SIX PILLARS:
1. Shadow Ops — work in WhatsApp/text/spreadsheets/memory
2. Exception Handling — fire-fighting and inconsistent triage
3. Audit Trail — can the operation prove what happened?
4. Knowledge & Decisions — undocumented SOPs, bottleneck approvers
5. Handoffs & SLAs — context loss, missed deadlines
6. Channels & Evidence — scattered information, missing system of record

EVIDENCE TIERING:
Tier1 = directly stated by client; Tier2 = inferred from observable; Tier3 = assumption.
Every finding must be tagged.

EXCEPTION IDENTIFICATION:
Capture exceptions with: name, frequency, severity, current handling, why it persists.
For each exception, surface the audit trail gap (what can't be proven later).

OUTPUT FORMAT:
Return valid JSON matching DiscoveryConductorResult. No markdown fences.`;

export interface DiscoveryConductorResult {
  pre_call_brief: PreCallBrief;
  discovery_notes_structured: DiscoveryNotesStructured;
  shadow_ops_map: ShadowOpsMap;
  exception_library: ExceptionLibrary;
  // Slice that feeds Agent 8 learning between 3A and 3B
  vertical: string;
  pillar_findings: Array<{ pillar: string; estimated_usd: number }>;
  new_exceptions: Array<{ type: string; severity: string; resolution: string }>;
}

export interface DiscoveryConductorInput {
  qualified_lead_brief: QualifiedLeadBrief;
  call_context: CallContext;
  vertical: string;
  mode?: 'pre_call_prep' | 'discovery_execution';
}

interface SubAgentAInputs extends Record<string, unknown> {
  discovery_input: DiscoveryConductorInput;
}

function buildUserPrompt(input: DiscoveryConductorInput): string {
  const lines: string[] = [];
  lines.push(`Mode: ${input.mode ?? 'discovery_execution'}`);
  lines.push(`Vertical: ${input.vertical}`);
  lines.push('');
  lines.push('## QUALIFIED LEAD BRIEF');
  for (const [k, v] of Object.entries(input.qualified_lead_brief)) {
    if (v !== undefined && v !== null && v !== '') lines.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  }
  lines.push('');
  lines.push('## CALL CONTEXT');
  if (input.call_context.call_transcript_summary) lines.push(`Transcript summary: ${input.call_context.call_transcript_summary}`);
  if (input.call_context.call_notes) lines.push(`Notes: ${input.call_context.call_notes}`);
  if (input.call_context.call_duration_minutes) lines.push(`Duration: ${input.call_context.call_duration_minutes} min`);
  if (input.call_context.attendees) lines.push(`Attendees: ${input.call_context.attendees.join(', ')}`);
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Run six-pillar discovery. Map observed shadow ops tasks. Build the exception library specific to this client.');
  lines.push('Set vertical, pillar_findings (per pillar with estimated_usd), and new_exceptions (any exception not in the master library).');
  lines.push('Return ONLY valid JSON matching DiscoveryConductorResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runDiscoveryConductor(
  ctx: SubAgentContext,
): Promise<SubAgentResult<DiscoveryConductorResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.discovery_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'discovery_audit',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as DiscoveryConductorResult;
    if (!result.vertical) result.vertical = input.vertical;

    return {
      sub_agent_id: '3A-discovery-conductor',
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
    return buildP1Failure<DiscoveryConductorResult>(
      '3A-discovery-conductor',
      'agent-3-sales-engineer',
      `Discovery conductor failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
