/**
 * Sub-agent 8A — Pattern Collector
 *
 * Function: Apply the three-tier confirmation rule to learning events.
 * NOT responsible for: writing updates, distributing learnings.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 8A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent8Input, PatternCollectorResult } from '../types';

const SYSTEM_PROMPT = `You are the Pattern Collector sub-agent for the Uptimize Vertical Intelligence system.

YOUR SINGLE FUNCTION:
Collect learning signals from pipeline events and evaluate their significance using
the three-tier confirmation rule. You evaluate and classify. You do not apply updates
to any documents or databases (that is Sub-agent 8B's function).

YOU ARE NOT RESPONSIBLE FOR:
- Writing updates to playbooks or the exception library (that is Sub-agent 8B)
- Making direct changes to any data in the system — you classify and recommend
- Distributing learnings to other agents (that is Sub-agent 8B's domain)

THE THREE-TIER CONFIRMATION RULE:
1 data point in this vertical: WATCH — flag for tracking. Update nothing.
2 matching data points in this vertical: EMERGING — recommend tentative update.
3+ matching data points in this vertical: VALIDATED — recommend confirmed update.
Contradicting data points: FLAG — do not auto-resolve, surface for Pedro review.

PATTERN TYPES TO EVALUATE:
shadow_ops_signal_weight: A specific shadow ops signal appeared (or didn't appear) in
  a vertical where the playbook predicted it would (or wouldn't).
money_leak_multiplier: The actual value of a pillar was significantly different from
  the calculated estimate. How different? By how much?
exception_pattern: A new exception type appeared that is not in the Exception Library.
outreach_hook_performance: A specific hook type produced (or failed to produce) a response.
health_score_driver: A specific action or intervention changed the health score in a
  predictable direction.
intervention_effectiveness: A specific quick_win recommendation improved or failed to
  improve the next week's health score.
model_performance: Track edit rates per task profile to identify models that need upgrade.

SIGNIFICANCE EVALUATION:
For each learning event, determine:
  Is this the first time this pattern has appeared in this vertical? (WATCH)
  Does this match an emerging pattern already flagged? (increment to TENTATIVE)
  Does this match a tentative pattern? (increment to VALIDATED)
  Does this contradict any existing data? (FLAG — do not resolve automatically)

QUANTIFICATION:
For multiplier learnings: what was the estimated value? What was the actual confirmed value?
What is the percentage difference? Large differences (>30%) may indicate a systematic
issue with the formula, not just a data point.

OUTPUT FORMAT:
Return valid JSON matching the PatternCollectorResult type. Every pattern_evaluated
entry must include the data_points_collected count and the basis for the significance
classification. "This happened once" is significance = watch and nothing else.
significance must be one of: watch | tentative | validated | flag.
recommended_action must be one of: no_change | tentative_update | confirmed_update | flag_for_pedro.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent8_input: Agent8Input;
}

function buildUserPrompt(input: Agent8Input): string {
  const lines: string[] = [];
  lines.push(`BATCH — ${input.events.length} learning events`);
  lines.push(`Triggered by: ${input.triggered_by}`);
  if (input.weekly_window) lines.push(`Weekly window: ${input.weekly_window.week_of}`);
  lines.push('');
  lines.push('## LEARNING EVENTS TO EVALUATE');

  for (const e of input.events) {
    lines.push('');
    lines.push(`### Event ${e.id}`);
    lines.push(`Vertical: ${e.vertical}`);
    lines.push(`Source: ${e.source_agent_id}`);
    lines.push(`Type: ${e.learning_type}`);
    lines.push(`Key: ${e.key}`);
    lines.push(`Existing data points (cumulative for this vertical+type+key): ${e.data_points}`);
    lines.push(`Existing significance: ${e.significance}`);
    lines.push(`Existing confidence: ${e.confidence}`);
    lines.push(`Created: ${e.created_at}`);
    lines.push(`Anonymized payload: ${e.value}`);
  }

  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Group events that represent the same pattern (same vertical+type+key).');
  lines.push('For each pattern, classify significance and recommended_action.');
  lines.push('Detect contradictions: if two events for the same pattern point in opposite directions, flag (do NOT resolve).');
  lines.push('For multiplier or weight changes, compute percentage_difference and include quantification.');
  lines.push('Return ONLY valid JSON matching PatternCollectorResult. No markdown fences.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string): PatternCollectorResult {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned) as PatternCollectorResult;
}

export async function runPatternCollector(
  ctx: SubAgentContext,
): Promise<SubAgentResult<PatternCollectorResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const agent8Input = inputs.agent8_input;
  const start = Date.now();

  if (agent8Input.events.length === 0) {
    return {
      sub_agent_id: '8A-pattern-collector',
      parent_agent_id: 'agent-8-intelligence',
      task_completed: true,
      result: { evaluations: [], events_processed: 0, contradictions_detected: 0 },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No events to evaluate — empty batch'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(agent8Input);
    const fallback = await executeWithFallback(
      'pattern_collection',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content);
    const contradictions = result.evaluations.filter(e => e.significance === 'flag').length;

    return {
      sub_agent_id: '8A-pattern-collector',
      parent_agent_id: 'agent-8-intelligence',
      task_completed: true,
      result: { ...result, contradictions_detected: contradictions },
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: [
        ...(fallback.fallback_used ? [`Fallback chain used (${fallback.attempts} attempts)`] : []),
        `Patterns evaluated: ${result.evaluations.length}`,
        `Contradictions detected: ${contradictions}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<PatternCollectorResult>(
      '8A-pattern-collector',
      'agent-8-intelligence',
      `Pattern collector failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
