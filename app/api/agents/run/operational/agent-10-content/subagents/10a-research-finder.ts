/**
 * Sub-agent 10A — Research & Angle Finder
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 10A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent10Input, ResearchFinderResult } from '../types';

const SYSTEM_PROMPT = `You are the Research & Angle Finder sub-agent for the Uptimize Content system.

YOUR SINGLE FUNCTION:
Identify the most compelling content angles for the coming week from real data.
You find what's worth saying. You do not write content (10B does).

ANGLE SOURCES (in order):
1. Recent Agent 5 wins (anonymized: "A fitness studio in [region]...")
2. Agent 8 validated patterns (3+ confirmations across deployments)
3. Industry triggers (news/market events connecting to Uptimize problems)
4. Pedro's frameworks (6-pillar, Two-Act, Evidence Tier, Money Leak Map)
5. Vertical patterns (audience recognition test)

ANGLE QUALITY:
Strong: "A gym owner spent 4.5 hours per week managing bookings via WhatsApp. After 60 days, that's 0 hours."
Weak: "Fitness businesses can benefit from operational automation."
Test: Could the reader share this with someone specific and say "this is exactly your situation"?

PRODUCE: 5-7 angles per cycle. Each with content_type, source, source_insight, why_now, audience, resonance.

OUTPUT FORMAT:
Return valid JSON matching ResearchFinderResult.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent10_input: Agent10Input;
}

function buildUserPrompt(input: Agent10Input): string {
  const lines: string[] = [];
  lines.push(`Week of: ${input.week_of}`);
  lines.push(`Trigger: ${input.trigger}`);
  lines.push(`Calendar: ${input.current_calendar.weeks_of_queue_remaining} weeks queued, ${input.current_calendar.pending_review_count} pending review${input.current_calendar.queue_low_warning ? ' [LOW]' : ''}`);
  lines.push('');
  if (input.source_inputs.agent5_recent_wins?.length) {
    lines.push('## RECENT WINS (Agent 5, anonymized)');
    for (const w of input.source_inputs.agent5_recent_wins) {
      lines.push(`- ${w.client_anonymized_label}: ${w.metric_before} → ${w.metric_after} (pillar: ${w.pillar}, ${w.intervention_summary})`);
    }
    lines.push('');
  }
  if (input.source_inputs.agent8_validated_patterns?.length) {
    lines.push('## VALIDATED PATTERNS (Agent 8)');
    for (const p of input.source_inputs.agent8_validated_patterns) {
      lines.push(`- [${p.vertical}, ${p.confirmations} confirmations] ${p.pattern_summary}${p.quantification ? ` (${p.quantification})` : ''}`);
    }
    lines.push('');
  }
  if (input.source_inputs.industry_triggers?.length) {
    lines.push('## INDUSTRY TRIGGERS');
    for (const t of input.source_inputs.industry_triggers) lines.push(`- ${t}`);
    lines.push('');
  }
  if (input.source_inputs.pedro_frameworks_recently_used?.length) {
    lines.push('## FRAMEWORKS RECENTLY USED (avoid repeating)');
    for (const f of input.source_inputs.pedro_frameworks_recently_used) lines.push(`- ${f}`);
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Produce 5-7 ContentAngles. Anonymize client data immediately. Apply the audience-recognition test.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runResearchFinder(
  ctx: SubAgentContext,
): Promise<SubAgentResult<ResearchFinderResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent10_input;
  const start = Date.now();

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(input), ctx.memory_context);
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

    const result = JSON.parse(stripJsonFences(fallback.content)) as ResearchFinderResult;
    return {
      sub_agent_id: '10A-research-finder',
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
        `Angles produced: ${result.angles.length}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<ResearchFinderResult>(
      '10A-research-finder',
      'agent-10-content',
      `Research finder failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
