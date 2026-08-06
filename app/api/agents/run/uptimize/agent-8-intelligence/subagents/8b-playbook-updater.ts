/**
 * Sub-agent 8B — Playbook Updater
 *
 * Function: Apply 8A's confirmed/tentative patterns and assemble the weekly brief.
 * NOT responsible for: evaluating significance, applying flag_only patterns.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 8B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type {
  Agent8Input,
  PatternCollectorResult,
  PlaybookUpdaterResult,
  AppliedUpdate,
} from '../types';

const SYSTEM_PROMPT = `You are the Playbook Updater sub-agent for the Uptimize Vertical Intelligence system.

YOUR SINGLE FUNCTION:
Apply Sub-agent 8A's confirmed and tentative patterns to the appropriate knowledge
base entries. Assemble the weekly intelligence brief for Pedro. Prepare the learning
distribution content for relevant agents. You apply and communicate.

YOU ARE NOT RESPONSIBLE FOR:
- Evaluating pattern significance (that is Sub-agent 8A's function, already complete)
- Making decisions about whether to update — 8A made those recommendations
- Applying any updates that 8A classified as flag_only or watch — those go to Pedro for review

UPDATE APPLICATION RULES:
Apply IMMEDIATELY if: significance = validated (3+ data points)
Apply with EMERGING label if: significance = tentative (2 data points)
  Label as: "EMERGING PATTERN — 2/3 confirmation points. Watch for one more data point."
DEFER to Pedro if: significance = flag or watch, or contradictions_found is non-empty

MULTIPLIER UPDATES:
Maximum change per cycle: ±15%.
If suggested change > 15%, split across two cycles with a flag noting the large shift.
Always record: old_value, new_value, percentage_change, date, data_points.

EXCEPTION LIBRARY UPDATES:
New exception entries must include all required fields from the Exception Library format:
  EX-ID (assign next available), name, pillar, trigger, frequency, severity, resolution,
  escalation, prevention, automation_potential, exception_tags.

VERTICAL PLAYBOOK UPDATES:
Shadow ops signal additions: Add to the signal detection table with evidence tier.
Vertical benchmark updates: Update the range and note the evidence base.
Common leak additions: Add to the "what to look for" section with frequency data.

WEEKLY INTELLIGENCE BRIEF:
Must be specific enough to change behavior. Vague statements are rejected.
Each section names: vertical, validated_updates count, emerging_patterns count,
contradictions_for_pedro count, and 1-3 specific behavioral highlights.

PEDRO ACTION ITEMS: Each item must be a specific decision or action Pedro can take.
Wrong: "Review the learnings."
Right: "Two contradicting data points on the healthcare Audit Trail multiplier.
Check: does HIPAA compliance training reduce the risk score, or does it create
more documentation overhead? Your call on which interpretation to apply."

MODEL_PERFORMANCE UPDATES:
Apply NEVER directly — model_performance always defers to Pedro. Generate a
ModelPerformanceSignal entry on the brief, do not modify TASK_PROFILES.

OUTPUT FORMAT:
Return valid JSON matching the PlaybookUpdaterResult type. Every update in
updates_applied must include old_content_summary and new_content_summary — without
both, the update cannot be audited or reversed. Never apply an update without both fields.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent8_input: Agent8Input;
  sub_agent_a_result?: PatternCollectorResult;
}

function buildUserPrompt(input: Agent8Input, patternResult: PatternCollectorResult): string {
  const lines: string[] = [];
  lines.push(`Triggered by: ${input.triggered_by}`);
  if (input.weekly_window) lines.push(`Weekly window: ${input.weekly_window.week_of}`);
  lines.push(`Total events processed by 8A: ${patternResult.events_processed}`);
  lines.push(`Contradictions detected: ${patternResult.contradictions_detected}`);
  lines.push('');
  lines.push('## 8A EVALUATIONS — APPLY OR DEFER');

  patternResult.evaluations.forEach((evaluation, idx) => {
    lines.push('');
    lines.push(`### Evaluation #${idx}`);
    lines.push(`Vertical: ${evaluation.vertical}`);
    lines.push(`Type: ${evaluation.learning_type}, Key: ${evaluation.key}`);
    lines.push(`Data points: ${evaluation.data_points_collected}`);
    lines.push(`Significance: ${evaluation.significance}`);
    lines.push(`Recommended action: ${evaluation.recommended_action}`);
    lines.push(`Basis: ${evaluation.basis}`);
    if (evaluation.contradicts_existing) {
      lines.push(`Contradicts existing — old: ${evaluation.contradicts_existing.existing_value_summary}`);
      lines.push(`Contradicts existing — new: ${evaluation.contradicts_existing.new_value_summary}`);
    }
    if (evaluation.quantification) {
      lines.push(`Quantification: estimated=${evaluation.quantification.estimated_value}, actual=${evaluation.quantification.actual_value}, diff=${evaluation.quantification.percentage_difference}%`);
    }
    if (evaluation.recommended_update) {
      lines.push(`Update target: ${evaluation.recommended_update.target}`);
      lines.push(`  old: ${evaluation.recommended_update.old_summary}`);
      lines.push(`  new: ${evaluation.recommended_update.new_summary}`);
    }
  });

  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('For each evaluation, decide: apply now (validated) | apply EMERGING (tentative) | defer to Pedro (flag/watch).');
  lines.push('For multiplier_change_pct exceeding ±15%, set to ±15% and add a Pedro action item explaining the cap.');
  lines.push('Generate the weekly_brief field IF triggered_by === "weekly_brief". Otherwise omit.');
  lines.push('Every applied update MUST have old_content_summary and new_content_summary.');
  lines.push('Return ONLY valid JSON matching PlaybookUpdaterResult. No markdown fences.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

const MULTIPLIER_CAP = 0.15;

function enforceInvariants(
  result: PlaybookUpdaterResult,
  patternResult: PatternCollectorResult,
): PlaybookUpdaterResult {
  // Strip any update that lacks required audit fields, or that 8A classified as flag/watch
  const validUpdates: AppliedUpdate[] = [];
  for (const u of result.updates_applied) {
    if (!u.old_content_summary || !u.new_content_summary) continue;
    const evaluation = patternResult.evaluations[u.evaluation_index];
    if (!evaluation) continue;
    if (evaluation.significance !== 'validated' && evaluation.significance !== 'tentative') continue;

    // model_performance must NEVER be applied automatically
    if (evaluation.learning_type === 'model_performance') continue;

    // Cap multiplier changes
    if (u.multiplier_change_pct !== undefined) {
      const sign = u.multiplier_change_pct >= 0 ? 1 : -1;
      const capped = Math.min(Math.abs(u.multiplier_change_pct), MULTIPLIER_CAP * 100) * sign;
      u.multiplier_change_pct = capped;
    }

    // Set applied_label from significance
    u.applied_label = evaluation.significance === 'validated' ? 'VALIDATED' : 'EMERGING';

    validUpdates.push(u);
  }

  return { ...result, updates_applied: validUpdates };
}

export async function runPlaybookUpdater(
  ctx: SubAgentContext,
  patternResult: PatternCollectorResult,
): Promise<SubAgentResult<PlaybookUpdaterResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const agent8Input = inputs.agent8_input;
  const start = Date.now();

  if (patternResult.evaluations.length === 0) {
    return {
      sub_agent_id: '8B-playbook-updater',
      parent_agent_id: 'agent-8-intelligence',
      task_completed: true,
      result: {
        updates_applied: [],
        distribution_notices: [],
        deferred_to_pedro: [],
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No evaluations — nothing to apply'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(agent8Input, patternResult), ctx.memory_context);
    const fallback = await executeWithFallback(
      'playbook_updating',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const parsed = JSON.parse(stripJsonFences(fallback.content)) as PlaybookUpdaterResult;
    const enforced = enforceInvariants(parsed, patternResult);

    return {
      sub_agent_id: '8B-playbook-updater',
      parent_agent_id: 'agent-8-intelligence',
      task_completed: true,
      result: enforced,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: [
        ...(fallback.fallback_used ? [`Fallback used (${fallback.attempts} attempts)`] : []),
        `Updates applied: ${enforced.updates_applied.length}`,
        `Deferred to Pedro: ${enforced.deferred_to_pedro.length}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: enforced.deferred_to_pedro.length > 0,
      escalation_severity: enforced.deferred_to_pedro.length > 0 ? 'P2' : undefined,
      escalation_reason: enforced.deferred_to_pedro.length > 0
        ? `${enforced.deferred_to_pedro.length} pattern(s) deferred to Pedro for decision`
        : undefined,
    };
  } catch (err) {
    return buildP1Failure<PlaybookUpdaterResult>(
      '8B-playbook-updater',
      'agent-8-intelligence',
      `Playbook updater failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
