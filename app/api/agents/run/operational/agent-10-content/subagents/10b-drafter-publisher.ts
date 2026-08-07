/**
 * Sub-agent 10B — Drafter & Publisher
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 10B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent10Input, DrafterPublisherResult, ResearchFinderResult } from '../types';

const SYSTEM_PROMPT = `You are the Drafter & Publisher sub-agent for the Uptimize Content system.

YOUR SINGLE FUNCTION:
Take 10A's angles and produce complete, publish-ready content in Pedro Acosta's voice.
Manage the content calendar. Route everything through the approval queue.

PEDRO'S VOICE — APPLY:
DO use: specific numbers ($2,400/mo not "thousands"); active verbs (found, eliminated);
short sentences for impact; setup-diagnosis-solution structure; "we" for Uptimize, "you" for reader.
DO NOT use: corporate jargon (leverage, synergize, streamline); generic AI hype (revolutionary,
transformative); passive voice; hedging (might be, could potentially); >3 sentences before the point.

LINKEDIN POST (150-300 words):
Line 1: Specific concrete hook (statement, not question).
Lines 2-4: Diagnosis. What it cost. Why it happened.
Lines 5-8: Solution. What changed. The result.
Final line: Implication or ask.

ARTICLE (1,200-2,000 words):
Title (specific, searchable, informative — not clever).
Intro: problem named precisely (2-3 paragraphs).
Section 1: Why this exists (root cause).
Section 2: What it costs (Money Leak framing).
Section 3: What fixing it looks like.
Section 4: 3-step action framework.
Close: One clear takeaway. No "in conclusion."

APPROVAL: Every draft.approval_status = 'pending_pedro_review'. Never 'approved' — only Pedro.

CALENDAR: Maintain 2 weeks of approved content. Flag if queue < 1 week.

OUTPUT FORMAT:
Return valid JSON matching DrafterPublisherResult.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent10_input: Agent10Input;
  sub_agent_a_result?: ResearchFinderResult;
}

function buildUserPrompt(input: Agent10Input, research: ResearchFinderResult): string {
  const lines: string[] = [];
  lines.push(`Week of: ${input.week_of}`);
  lines.push(`Calendar: ${input.current_calendar.weeks_of_queue_remaining} weeks queued${input.current_calendar.queue_low_warning ? ' [LOW — prioritize drafts]' : ''}`);
  lines.push('');
  lines.push('## ANGLES FROM 10A');
  for (const a of research.angles) {
    lines.push(`### ${a.angle_id} [${a.content_type}, resonance ${a.estimated_resonance_0_10}/10]`);
    lines.push(`Summary: ${a.angle_summary}`);
    lines.push(`Why now: ${a.why_now}`);
    lines.push(`Source insight: ${a.source_insight}`);
    lines.push(`Audience: ${a.target_audience}`);
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Draft each angle into a ContentDraftView. word_count must match the actual body_text length.');
  lines.push('Every approval_status = "pending_pedro_review". Never approve.');
  lines.push('Compute calendar_status. Return ONLY valid JSON matching DrafterPublisherResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function enforceApproval(result: DrafterPublisherResult): DrafterPublisherResult {
  for (const d of result.drafts) {
    d.approval_status = 'pending_pedro_review';  // non-configurable
  }
  return result;
}

export async function runDrafterPublisher(
  ctx: SubAgentContext,
  research: ResearchFinderResult,
): Promise<SubAgentResult<DrafterPublisherResult>> {
  const start = Date.now();

  if (research.angles.length === 0) {
    return {
      sub_agent_id: '10B-drafter-publisher',
      parent_agent_id: 'agent-10-content',
      task_completed: true,
      result: {
        drafts: [],
        calendar_status: { scheduled_count: 0, pending_review_count: 0, published_this_week: 0, weeks_of_queue_remaining: 0, queue_low_warning: true },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0, tokens_output: 0,
      processing_notes: ['No angles from 10A — nothing to draft'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const inputs = ctx.inputs as SubAgentBInputs;
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(inputs.agent10_input, research), ctx.memory_context);
    const fallback = await executeWithFallback(
      'content_drafting',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.6,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = enforceApproval(JSON.parse(stripJsonFences(fallback.content)) as DrafterPublisherResult);
    return {
      sub_agent_id: '10B-drafter-publisher',
      parent_agent_id: 'agent-10-content',
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
        `Drafts: ${result.drafts.length}`,
        ...(result.calendar_status.queue_low_warning ? ['Queue is LOW — < 1 week remaining'] : []),
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: result.calendar_status.queue_low_warning,
      escalation_severity: result.calendar_status.queue_low_warning ? 'P3' : undefined,
      escalation_reason: result.calendar_status.queue_low_warning ? 'Content queue < 1 week — Pedro should approve drafts soon' : undefined,
    };
  } catch (err) {
    return buildP1Failure<DrafterPublisherResult>(
      '10B-drafter-publisher',
      'agent-10-content',
      `Drafter failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
