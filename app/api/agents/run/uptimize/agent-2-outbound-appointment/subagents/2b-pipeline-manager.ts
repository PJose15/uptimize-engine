/**
 * Sub-agent 2B — Pipeline Manager
 *
 * Function: Outbound run sheet, bookings, nurture queue, pipeline stage transitions.
 * NOT responsible for: message copy (2A's domain).
 *
 * Source: Sprint 12.6. Skills: stage-transition-validation, nurture-entry-construction.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  OutboundRunSheet,
  Booking,
  NurtureEntry,
  VolumeTargets,
} from '../types';
import type { MessageArchitectInput } from './2a-message-architect';

const SYSTEM_PROMPT = `You are the Pipeline Manager sub-agent for Uptimize Outbound.

YOUR SINGLE FUNCTION:
Plan the outbound run sheet, manage bookings (qualification → confirmation),
construct nurture queue entries for prospects who aren't ready. You manage state.
You do not write outreach copy (2A's domain).

YOU ARE NOT RESPONSIBLE FOR:
- Message library construction (2A)
- Conversation update copy (2A)
- Hook writing or sequence content (2A)

OUTBOUND RUN SHEET:
daily_plan: 4-8 blocks covering new outreach, follow-ups, replies/qualification, booking admin.
Each block: count, channel, suggested send day/time, rationale.
sequence_rules: when to escalate from email → linkedin → call.
qualification_rules: criteria to mark hard_qualified vs soft_qualified.
no_show_protocol: how to handle no-shows.

BOOKINGS:
For each booked meeting: lead_id, meeting_type (discovery/audit/demo), confirmed_time,
qualified_lead_summary (problem, impact, urgency, authority, stack, timeline),
qualification_level, confirmation_message timing.

NURTURE QUEUE (CRITICAL):
For every prospect who engaged but is NOT ready, build a NurtureEntry.
Fields: lead_id, company, vertical, category (hot/warm/cold/lost_deal), reason,
original_pain, what_was_tried.
Hot: received proposal, said "not yet"
Warm: qualified, timing wrong
Cold: early-stage inquiry
Lost: explicit no
NEVER skip nurture queue entries — they are the input to Agent 7.

PIPELINE STAGE VALIDATION:
Every stage transition must be valid. No skipping ahead. Track current stage per lead.

OUTPUT FORMAT:
Return valid JSON matching PipelineManagerResult. No markdown fences.`;

export interface PipelineManagerResult {
  outbound_run_sheet: OutboundRunSheet;
  bookings: Booking[];
  nurture_queue: NurtureEntry[];
  volume_targets: VolumeTargets;
  channels_used: string[];
}

interface SubAgentBInputs extends Record<string, unknown> {
  agent2_input: MessageArchitectInput;
}

function buildUserPrompt(input: MessageArchitectInput): string {
  const lines: string[] = [];
  lines.push(`Channels: ${input.channels.join(', ')}`);
  if (input.offer_positioning) lines.push(`Offer positioning: ${input.offer_positioning}`);
  lines.push('');
  lines.push('## TARGET PACK FROM AGENT 1');
  lines.push(JSON.stringify(input.target_pack, null, 2).slice(0, 6000));
  lines.push('');
  if (input.in_flight_leads?.length) {
    lines.push('## IN-FLIGHT LEADS');
    lines.push(JSON.stringify(input.in_flight_leads, null, 2).slice(0, 4000));
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Plan the daily run sheet (volume, channels, timing).');
  lines.push('For replies that are ready: produce Bookings with full qualified_lead_summary.');
  lines.push('For prospects not ready: produce NurtureEntries with the correct category. NEVER skip these.');
  lines.push('Return ONLY valid JSON matching PipelineManagerResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runPipelineManager(
  ctx: SubAgentContext,
): Promise<SubAgentResult<PipelineManagerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.agent2_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'pipeline_stage_mgmt',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as PipelineManagerResult;

    return {
      sub_agent_id: '2B-pipeline-manager',
      parent_agent_id: 'agent-2-outbound-appointment',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: [
        ...(fallback.fallback_used ? [`Fallback used (${fallback.attempts})`] : []),
        `Bookings: ${result.bookings.length}`,
        `Nurture queue: ${result.nurture_queue.length}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<PipelineManagerResult>(
      '2B-pipeline-manager',
      'agent-2-outbound-appointment',
      `Pipeline manager failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
