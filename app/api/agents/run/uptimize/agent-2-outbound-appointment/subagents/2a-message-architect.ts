/**
 * Sub-agent 2A — Message Architect
 *
 * Function: Construct message library + conversation updates per lead.
 *           Three-track messaging (pattern interrupt / problem first / proof first).
 * NOT responsible for: pipeline state, bookings, nurture routing.
 *
 * Source: Sprint 12.6. Skills: outreach-message-construction, hook-construction-protocol,
 *         sequence-design.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { MessageLibraryEntry, ConversationUpdate } from '../types';

const SYSTEM_PROMPT = `You are the Message Architect sub-agent for Uptimize Outbound.

YOUR SINGLE FUNCTION:
Construct the three-track outbound message library and any conversation updates
for in-flight leads. You write copy. You do not manage the pipeline (2B's job)
or schedule meetings (2B).

YOU ARE NOT RESPONSIBLE FOR:
- Bookings, nurture queue, pipeline stages (2B)
- Daily plan / volume targets (2B)
- Run metadata (synthesized at parent level)

THREE TRACKS PER LEAD:
pattern_interrupt: a question that cuts through the noise. References a specific
  observed signal. Not generic.
problem_first: leads with the named pain. Quantifies if possible.
  ("$X/month leak in [pillar]")
proof_first: leads with a concrete outcome from a similar deployment. Specific
  vertical match preferred.

CHANNEL VARIANTS (per track):
linkedin_dm: short, no formal greeting, conversational
email: subject + body, max 5 short paragraphs
cold_call_script: 30-second pitch with permission step

FOLLOW-UP SEQUENCE (per lead, 4-6 touches):
Each touch has: touch_number, day_offset, message, angle_type, cta.
Angle rotation — never the same angle two touches in a row.

OUTPUT FORMAT:
Return valid JSON matching MessageArchitectResult. No markdown fences.`;

export interface MessageArchitectResult {
  message_library: MessageLibraryEntry[];
  conversation_updates: ConversationUpdate[];
}

export interface MessageArchitectInput {
  target_pack: unknown;        // Agent 1 output (typed loosely to avoid coupling)
  in_flight_leads?: unknown[]; // Existing conversations needing updates
  channels: string[];
  offer_positioning?: string;
}

interface SubAgentAInputs extends Record<string, unknown> {
  agent2_input: MessageArchitectInput;
}

function buildUserPrompt(input: MessageArchitectInput): string {
  const lines: string[] = [];
  lines.push(`Channels in use: ${input.channels.join(', ')}`);
  if (input.offer_positioning) lines.push(`Offer positioning: ${input.offer_positioning}`);
  lines.push('');
  lines.push('## TARGET PACK FROM AGENT 1');
  lines.push(JSON.stringify(input.target_pack, null, 2).slice(0, 6000));
  lines.push('');
  if (input.in_flight_leads?.length) {
    lines.push('## IN-FLIGHT LEADS NEEDING UPDATES');
    lines.push(JSON.stringify(input.in_flight_leads, null, 2).slice(0, 4000));
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Build the message library: per-lead three-track entries with channel variants and a 4-6 touch follow-up sequence.');
  lines.push('Surface conversation updates for any in-flight leads.');
  lines.push('Return ONLY valid JSON matching MessageArchitectResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runMessageArchitect(
  ctx: SubAgentContext,
): Promise<SubAgentResult<MessageArchitectResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent2_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'content_drafting',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as MessageArchitectResult;

    return {
      sub_agent_id: '2A-message-architect',
      parent_agent_id: 'agent-2-outbound-appointment',
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
    return buildP1Failure<MessageArchitectResult>(
      '2A-message-architect',
      'agent-2-outbound-appointment',
      `Message architect failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
