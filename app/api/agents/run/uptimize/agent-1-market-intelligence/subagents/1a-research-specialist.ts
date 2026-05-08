/**
 * Sub-agent 1A — Research Specialist
 *
 * Function: Produce raw researched candidates with shadow ops signals, evidence,
 *           pain categories, trigger events. Pre-scoring.
 * NOT responsible for: fit_score, hooks, CTA, final LeadRecord assembly.
 *
 * Source: derived per Sprint 12.3 split. Skills: mcp-research-orchestration,
 *         signal-detection-scoring, evidence-tiering.
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent1Input,
  EvidenceTier,
  EvidenceSource,
  PainCategory,
} from '../types';

const SYSTEM_PROMPT = `You are the Research Specialist sub-agent for Uptimize Market Intelligence.

YOUR SINGLE FUNCTION:
Take the input query or prospect list, gather observable evidence per candidate,
detect shadow ops signals, identify pain categories with pillar mapping, and surface
trigger events. You research and observe. You do not score, rank, or write outreach
copy — Sub-agent 1B does that.

YOU ARE NOT RESPONSIBLE FOR:
- Fit score calculation (1B's domain)
- Hook construction or CTA writing (1B)
- Pattern interrupt questions (1B)
- Final LeadRecord assembly or pack ranking (1B)

WHAT YOU PRODUCE PER CANDIDATE:
- Stable lead_id, name, company, role, segment
- Observable evidence: 1-3 EvidenceSources (website / social / job_post / review / news)
- Pain categories (1-2) mapped to a specific pillar (1-6) with evidence reference
- Shadow ops signals observed (e.g. "WhatsApp CTA on website", "spreadsheet ops mentioned in review")
- Exception hypotheses (top 3 likely exceptions this business deals with)
- Trigger event (concrete event that makes NOW different — or "unknown")
- Stack assumptions (what tools they likely use, with confidence)
- Evidence tier per candidate: Tier1 (directly observed), Tier2 (inferred from public),
  Tier3 (assumption only)

EVIDENCE TIER RULES:
Tier1 — directly observable: review text, job posting, website language. The strongest tier.
Tier2 — inferred from observable: company size + vertical → likely tool stack.
Tier3 — pure assumption: "most fitness studios deal with X". Last resort. Never the only tier.

If no Tier1 evidence exists for a candidate, mark confidence = "low".

OUTPUT FORMAT:
Return valid JSON matching the ResearchSpecialistResult type. Every candidate must
have at least one EvidenceSource. No markdown fences. No explanation.`;

export interface CandidateLeadResearch {
  lead_id: string;
  name: string;
  company: string;
  role: string;
  segment: string;
  evidence_sources: EvidenceSource[];
  evidence_tier: EvidenceTier;
  pain_categories: PainCategory[] | string[];
  pillar_mapping: Array<{
    pain: string;
    pillar: number;
    evidence: string;
    tier: EvidenceTier;
  }>;
  shadow_ops_signals_observed: string[];
  exception_hypotheses_top3: string[];
  trigger_event: string;
  stack_assumptions: Array<{ assumption: string; confidence: 'high' | 'medium' | 'low' }>;
}

export interface ResearchSpecialistResult {
  candidates: CandidateLeadResearch[];
  do_not_target: Array<{ reason: string; examples: string[] }>;
  shadow_ops_insights: {
    top_signals_found: string[];
    common_exception_patterns: string[];
    notes: string;
  };
  research_notes: string;
  sources_used: string[];
}

interface SubAgentAInputs extends Record<string, unknown> {
  agent1_input: Agent1Input;
}

function buildUserPrompt(input: Agent1Input): string {
  const lines: string[] = [];

  if (input.query) {
    lines.push(`## DISCOVERY QUERY\n${input.query}\n`);
    if (input.queryIntent) {
      lines.push(`Industry: ${input.queryIntent.industry}`);
      lines.push(`Location: ${input.queryIntent.location}`);
      if (input.queryIntent.businessSize) lines.push(`Size: ${input.queryIntent.businessSize}`);
      if (input.queryIntent.count) lines.push(`Target count: ${input.queryIntent.count}`);
      lines.push('');
    }
  }

  if (input.prospect_list?.length) {
    lines.push(`## PROSPECT LIST (${input.prospect_list.length} candidates)`);
    for (const p of input.prospect_list) {
      lines.push(`- ${p.name} @ ${p.company}${p.domain ? ` (${p.domain})` : ''}${p.linkedin_url ? ` [${p.linkedin_url}]` : ''}`);
    }
    lines.push('');
  }

  if (input.context) {
    if (input.context.offer_positioning) lines.push(`## OFFER POSITIONING\n${input.context.offer_positioning}\n`);
    if (input.context.shadow_ops_focus?.length) lines.push(`Shadow ops focus pillars: ${input.context.shadow_ops_focus.join(', ')}\n`);
    if (input.context.research_depth) lines.push(`Research depth: ${input.context.research_depth}\n`);
  }

  lines.push('## YOUR TASK');
  lines.push('For each candidate, research observable evidence and produce a CandidateLeadResearch entry.');
  lines.push('Hunt the SHADOW OPS signal library: WhatsApp/text CTAs, spreadsheet mentions, "one person knows how", missing-info chasing, slow approvals, manual reconciliation, no-show chaos.');
  lines.push('Return ONLY valid JSON matching ResearchSpecialistResult. No markdown fences.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runResearchSpecialist(
  ctx: SubAgentContext,
): Promise<SubAgentResult<ResearchSpecialistResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const agent1Input = inputs.agent1_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(agent1Input);
    const fallback = await executeWithFallback(
      'shadow_ops_research',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as ResearchSpecialistResult;

    return {
      sub_agent_id: '1A-research-specialist',
      parent_agent_id: 'agent-1-market-intelligence',
      task_completed: true,
      result,
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
    return buildP1Failure<ResearchSpecialistResult>(
      '1A-research-specialist',
      'agent-1-market-intelligence',
      `Research specialist failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
