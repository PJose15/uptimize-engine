/**
 * Sub-agent 1B — Scoring Analyst
 *
 * Function: Take 1A's researched candidates and produce final LeadRecord[]
 *           with fit scores, shadow ops density, hooks, CTA, pattern interrupts.
 * NOT responsible for: research, evidence gathering, signal detection.
 *
 * Source: derived per Sprint 12.3 split. Skills: fit-score-calculation,
 *         shadow-ops-density-scoring, hook-construction-protocol.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent1Input, LeadRecord, AngleOfTheDay } from '../types';
import type { ResearchSpecialistResult } from './1a-research-specialist';

const SYSTEM_PROMPT = `You are the Scoring Analyst sub-agent for Uptimize Market Intelligence.

YOUR SINGLE FUNCTION:
Take the research candidates produced by Sub-agent 1A and produce final ranked
LeadRecords with fit scores, shadow ops density scores, hooks, CTAs, and pattern
interrupt questions. You score and rank. You do not gather evidence.

YOU ARE NOT RESPONSIBLE FOR:
- Researching candidates (1A already did that)
- Discovering shadow ops signals (1A surfaced them)
- Pillar mapping (1A produced it — preserve it as-is)

FIT SCORE COMPUTATION (0-100 total, must equal sum of components):
- pain_intensity (0-20): how clearly the pain is observable
- urgency_trigger (0-15): is there a concrete event making NOW different?
- authority (0-15): is the contact a decision-maker?
- budget_likelihood (0-15): does evidence suggest budget?
- complexity_fit (0-15): is the operation complex enough to need us?
- tool_fit (0-10): do their stack assumptions overlap with what we automate?
- reachability (0-10): how findable is this contact?

SHADOW OPS DENSITY (0-10):
0-2: minimal shadow ops detected
3-5: some signals but not the main story
6-7: significant shadow ops; this is a real fit
8-10: shadow ops chaos; high-priority target

HOOK CONSTRUCTION (must be 140 chars or less per hook):
primary_hook: references a specific observed signal from 1A. Not generic.
backup_hook: a different angle for the same prospect.

PATTERN INTERRUPT QUESTION:
A single question that disrupts their default response and surfaces real pain.
Specific to this prospect, not template language.

CTA: Concrete next step. Not "let's chat" — something like
"Worth 15 minutes Tuesday at 2pm?" or "Reply with a YES and I'll send you the audit framework."

EVIDENCE TIER (preserve from 1A): high confidence requires Tier1 or Tier2.
Tier3-only candidates must be confidence="low" — these go to target_pack_secondary.

PRIMARY VS SECONDARY PACK:
Primary: top 60-70% by fit_score, all confidence high or medium with Tier1/Tier2 evidence.
Secondary: lower fit scores OR Tier3-only OR confidence "low".

ANGLE OF THE DAY:
Surface the most actionable angle across the full pack — primary, secondary, and
the pattern_interrupt question that fits the most prospects.

OUTPUT FORMAT:
Return valid JSON matching ScoringAnalystResult. Every LeadRecord must have a
fit_score_breakdown that sums (within rounding) to fit_score_0_100. No markdown fences.`;

export interface ScoringAnalystResult {
  target_pack_primary: LeadRecord[];
  target_pack_secondary: LeadRecord[];
  angle_of_the_day: AngleOfTheDay;
}

interface SubAgentBInputs extends Record<string, unknown> {
  agent1_input: Agent1Input;
  sub_agent_a_result?: ResearchSpecialistResult;
}

function buildUserPrompt(input: Agent1Input, research: ResearchSpecialistResult): string {
  const lines: string[] = [];
  lines.push(`Mode: ${input.mode}`);
  if (input.context?.offer_positioning) lines.push(`Offer positioning: ${input.context.offer_positioning}`);
  lines.push('');
  lines.push(`## RESEARCH CANDIDATES FROM 1A (${research.candidates.length} total)`);

  for (const c of research.candidates) {
    lines.push('');
    lines.push(`### ${c.lead_id} — ${c.name} @ ${c.company} (${c.role}, ${c.segment})`);
    lines.push(`Evidence tier: ${c.evidence_tier}`);
    lines.push(`Pain categories: ${(c.pain_categories as string[]).join(', ')}`);
    lines.push(`Pillar mapping: ${c.pillar_mapping.map(p => `${p.pain}→P${p.pillar}(${p.tier})`).join('; ')}`);
    lines.push(`Shadow ops signals: ${c.shadow_ops_signals_observed.join('; ')}`);
    lines.push(`Exception hypotheses: ${c.exception_hypotheses_top3.join('; ')}`);
    lines.push(`Trigger event: ${c.trigger_event}`);
    lines.push(`Stack assumptions: ${c.stack_assumptions.map(s => `${s.assumption} (${s.confidence})`).join('; ')}`);
    lines.push(`Evidence sources: ${c.evidence_sources.map(e => `[${e.type}] ${e.reference}`).join('; ')}`);
  }

  lines.push('');
  lines.push('## RESEARCH CONTEXT');
  lines.push(`Top shadow ops signals across the pack: ${research.shadow_ops_insights.top_signals_found.join('; ')}`);
  lines.push(`Common exception patterns: ${research.shadow_ops_insights.common_exception_patterns.join('; ')}`);
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Score every candidate. Construct hooks (≤140 chars each). Write a pattern_interrupt and CTA per candidate.');
  lines.push('Split into primary vs secondary packs. Produce angle_of_the_day for the full set.');
  lines.push('Return ONLY valid JSON matching ScoringAnalystResult.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function enforceFitScoreSum(records: LeadRecord[]): LeadRecord[] {
  for (const r of records) {
    const b = r.fit_score_breakdown;
    const sum = b.pain_intensity + b.urgency_trigger + b.authority +
      b.budget_likelihood + b.complexity_fit + b.tool_fit + b.reachability;
    // If breakdown drifts more than 2 points from total, recompute total from breakdown.
    if (Math.abs(sum - r.fit_score_0_100) > 2) {
      r.fit_score_0_100 = sum;
    }
  }
  return records;
}

export async function runScoringAnalyst(
  ctx: SubAgentContext,
  research: ResearchSpecialistResult,
): Promise<SubAgentResult<ScoringAnalystResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const agent1Input = inputs.agent1_input;
  const start = Date.now();

  if (research.candidates.length === 0) {
    return {
      sub_agent_id: '1B-scoring-analyst',
      parent_agent_id: 'agent-1-market-intelligence',
      task_completed: true,
      result: {
        target_pack_primary: [],
        target_pack_secondary: [],
        angle_of_the_day: { primary_angle: '', secondary_angle: '', pattern_interrupt_question: '' },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No candidates from 1A — empty scoring batch'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(agent1Input, research), ctx.memory_context);
    const fallback = await executeWithFallback(
      'signal_scoring',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const parsed = JSON.parse(stripJsonFences(fallback.content)) as ScoringAnalystResult;
    parsed.target_pack_primary = enforceFitScoreSum(parsed.target_pack_primary ?? []);
    parsed.target_pack_secondary = enforceFitScoreSum(parsed.target_pack_secondary ?? []);

    return {
      sub_agent_id: '1B-scoring-analyst',
      parent_agent_id: 'agent-1-market-intelligence',
      task_completed: true,
      result: parsed,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used ? [`Fallback used (${fallback.attempts} attempts)`] : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<ScoringAnalystResult>(
      '1B-scoring-analyst',
      'agent-1-market-intelligence',
      `Scoring analyst failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
