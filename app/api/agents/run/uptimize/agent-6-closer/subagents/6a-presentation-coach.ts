/**
 * Sub-agent 6A — Presentation Coach
 *
 * Function: Generate the pre-presentation guide and capture post-presentation debrief.
 * NOT responsible for: contracts, credentials, conducting the presentation.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 6A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent6Input,
  PresentationCoachResult,
  PrePresentationGuide,
  PostPresentationDebrief,
} from '../types';

const SYSTEM_PROMPT = `You are the Presentation Coach sub-agent for the Uptimize Closer system.

YOUR SINGLE FUNCTION:
Produce the pre-presentation guide that Pedro uses to walk into every closing
conversation prepared. After Pedro logs the outcome, capture the post-presentation
debrief so the learning feeds Agent 8 and the agreed terms feed Sub-agent 6B.

YOU ARE NOT RESPONSIBLE FOR:
- Contract execution or credential collection (that is Sub-agent 6B's function)
- Conducting the presentation yourself — Pedro does that
- Making scope decisions — those are Pedro's decisions during the presentation

THE PRE-PRESENTATION GUIDE REQUIRES:

OPENING STATEMENT: The exact first sentence Pedro should say after pleasantries.
  Must reference something specific from the discovery call. Not generic.

LEAD WITH THIS NUMBER: The single monthly leak total. Pedro says this first.
  Then pauses. Then breaks it down. The anchor must be stated before the breakdown.

RECOMMENDED SEQUENCE: The step-by-step flow of the 30-minute conversation.
  Do not skip the "questions" phase — asking them to react to the numbers reveals
  the real objections before they become deal-killers.

OBJECTION RESPONSES: The 3 most likely objections for this specific client.
  Source: Agent 3's close_plan anticipated_objections.
  Each response must use the client's own language from the discovery call.
  Response format: Acknowledge → Reframe → Evidence → Ask

CLOSING QUESTION: The exact question to end the presentation with.
  Not "So what do you think?" — that invites indefinite delay.
  Right: "Based on what we've walked through, does the Growth tier feel like the right
  starting point, or would you prefer to begin with just the [top leak]?"

RED LINES: What Pedro should not say or do in this specific presentation.
  Based on the client intelligence from Agent 3. Client-specific, not generic.

THE POST-DEBRIEF captures:
What actually happened (signed / negotiating / thinking / no)
Which objections actually came up (may differ from anticipated)
What worked and what did not work (feeds Agent 8 intelligence)
Any negotiated scope changes (feeds Sub-agent 6B's contract inputs)

OUTPUT FORMAT:
Return valid JSON matching the PresentationCoachResult type. The pre_presentation_guide
is fully required. post_presentation_debrief is conditionally required — only after
Pedro logs the outcome. If debrief inputs are not yet available, omit that field.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent6_input: Agent6Input;
}

function buildUserPrompt(input: Agent6Input): string {
  const lines: string[] = [];
  lines.push(`MODE: ${input.mode}`);
  lines.push('');
  lines.push('## PROPOSAL PACKAGE');
  lines.push(`Recommended tier: ${input.proposal.recommended_tier}`);
  lines.push(`Tier rationale: ${input.proposal.tier_rationale}`);
  lines.push(`Growth option: $${input.proposal.growth_option.build_fee_usd} build / $${input.proposal.growth_option.monthly_retainer_usd}/mo`);
  lines.push('');
  lines.push('## MONEY LEAK MAP');
  lines.push(`Total monthly value: $${input.money_leak_map.total_monthly_value_usd}`);
  lines.push(`Confidence-weighted: $${input.money_leak_map.confidence_weighted_usd}`);
  lines.push(`Lead with this number: $${input.close_plan.lead_with_this_number}`);
  lines.push(`Key assumptions client may challenge:`);
  for (const a of input.money_leak_map.key_assumptions) lines.push(`  - ${a}`);
  lines.push('');
  lines.push('## CLOSE PLAN');
  lines.push(`Decision maker profile: ${input.close_plan.decision_maker_profile}`);
  lines.push(`Urgency signal: ${input.close_plan.urgency_signal}`);
  lines.push(`Deal breakers to avoid: ${input.close_plan.deal_breakers_to_avoid.join('; ')}`);
  lines.push('Anticipated objections:');
  for (const o of input.close_plan.anticipated_objections) {
    lines.push(`  - [${o.likelihood}] ${o.objection}`);
    lines.push(`    Recommended: ${o.recommended_response}`);
    lines.push(`    Evidence: ${o.evidence_to_reference}`);
  }
  lines.push('');
  lines.push('## CLIENT INTELLIGENCE');
  lines.push(`Communication style: ${input.client_intelligence.communication_style}`);
  lines.push(`Decision speed: ${input.client_intelligence.decision_speed_signal}`);
  lines.push(`Problems in their words: "${input.client_intelligence.problems_in_their_words}"`);
  lines.push(`Specific phrases used: ${input.client_intelligence.specific_phrases_used.map(p => `"${p}"`).join(', ')}`);
  lines.push(`What they care most about: ${input.client_intelligence.what_they_care_most_about}`);
  lines.push(`Budget signals: ${input.client_intelligence.budget_signals.join('; ')}`);
  lines.push('');
  lines.push('## GATE 3 DECISION (from Pedro)');
  lines.push(`Approved: ${input.gate3_decision.proposalApproved}`);
  if (input.gate3_decision.tierRecommendation) lines.push(`Tier override: ${input.gate3_decision.tierRecommendation}`);
  if (input.gate3_decision.scopeModifications?.length) lines.push(`Scope mods: ${input.gate3_decision.scopeModifications.join('; ')}`);
  if (input.gate3_decision.notes) lines.push(`Notes: ${input.gate3_decision.notes}`);
  lines.push('');

  if (input.mode === 'post_close' && input.presentation_outcome) {
    const o = input.presentation_outcome;
    lines.push('## POST-PRESENTATION INPUTS (Pedro logged)');
    lines.push(`Outcome: ${o.status}`);
    if (o.agreed_tier) lines.push(`Agreed tier: ${o.agreed_tier} ($${o.agreed_build_fee_usd} build / $${o.agreed_monthly_retainer_usd}/mo)`);
    if (o.scope_inclusions?.length) lines.push(`Scope inclusions: ${o.scope_inclusions.join('; ')}`);
    if (o.scope_exclusions?.length) lines.push(`Scope exclusions: ${o.scope_exclusions.join('; ')}`);
    lines.push(`Relationship tone: ${o.relationship_tone}`);
    if (o.objections_raised.length) {
      lines.push('Objections raised:');
      for (const obj of o.objections_raised) {
        lines.push(`  - ${obj.objection}`);
        lines.push(`    Resolution: ${obj.resolution}`);
        if (obj.any_commitments_made) lines.push(`    Commitments made: ${obj.any_commitments_made}`);
      }
    }
    lines.push(`Client priorities stated: ${o.client_priorities_stated.join('; ')}`);
    if (o.specific_concerns_for_build.length) lines.push(`Specific concerns for build: ${o.specific_concerns_for_build.join('; ')}`);
    if (o.pedro_notes) lines.push(`Pedro notes: ${o.pedro_notes}`);
    lines.push('');
  }

  lines.push('## YOUR TASK');
  if (input.mode === 'pre_close') {
    lines.push('Produce the pre_presentation_guide. Do NOT include post_presentation_debrief.');
  } else {
    lines.push('Produce both: pre_presentation_guide (regenerated from current state) AND post_presentation_debrief from the Pedro-logged outcome above.');
  }
  lines.push('Return ONLY valid JSON matching PresentationCoachResult. No markdown fences. No explanation.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string, mode: 'pre_close' | 'post_close'): PresentationCoachResult {
  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const guide = parsed.pre_presentation_guide as PrePresentationGuide | undefined;
  if (!guide) throw new Error('pre_presentation_guide missing from 6A response');
  const debrief = mode === 'post_close'
    ? (parsed.post_presentation_debrief as PostPresentationDebrief | undefined) ?? null
    : null;
  return {
    pre_presentation_guide: guide,
    post_presentation_debrief: debrief ?? undefined,
  };
}

export async function runPresentationCoach(
  ctx: SubAgentContext,
): Promise<SubAgentResult<PresentationCoachResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const agent6Input = inputs.agent6_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(agent6Input);
    const fallback = await executeWithFallback(
      'presentation_coaching',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content, agent6Input.mode);

    return {
      sub_agent_id: '6A-presentation-coach',
      parent_agent_id: 'agent-6-closer',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used
        ? [`Fallback chain used (${fallback.attempts} attempts) — primary ${fallback.primary_provider} failed`]
        : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<PresentationCoachResult>(
      '6A-presentation-coach',
      'agent-6-closer',
      `Presentation coach failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
