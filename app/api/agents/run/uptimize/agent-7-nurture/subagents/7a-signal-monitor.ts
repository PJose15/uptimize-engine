/**
 * Sub-agent 7A — Signal Monitor
 *
 * Function: Detect new signals on nurture records and score readiness.
 * NOT responsible for: drafting messages, scheduling touches.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 7A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent7Input, SignalMonitorResult } from '../types';

const SYSTEM_PROMPT = `You are the Signal Monitor sub-agent for the Uptimize Nurture Intelligence system.

YOUR SINGLE FUNCTION:
Scan all active nurture prospects for new observable signals that indicate their
situation has changed. Score each prospect's re-engagement readiness. Recommend
whether to reintroduce them to the active pipeline, schedule a soft touch, or continue
monitoring. You detect and evaluate. You do not draft messages.

YOU ARE NOT RESPONSIBLE FOR:
- Writing any outreach messages (that is Sub-agent 7B's function)
- Making direct contact with any prospect
- Managing the nurture category schedules (that is Sub-agent 7B's domain)

SIGNALS TO MONITOR:
New reviews: A new review mentioning booking, scheduling, communication, or staff friction
Job postings: Administrative, operations, or coordination roles just posted
News events: Expansion announcement, new location, leadership change, funding event
Social activity: Significant change in posting frequency or theme (more frantic or more quiet)
Competitor signals: A competing business gained a clear advantage or lost client trust publicly
Status changes: Website redesigned, new services launched, hours extended

RELEVANCE SCORING PER SIGNAL (0-10):
0-2: Observed but no clear connection to shadow ops or timing shift
3-4: Weak connection — could be relevant, probably not
5-6: Moderate connection — definitely worth monitoring, possibly worth a soft touch
7-8: Strong connection — their situation has likely changed
9-10: Definitive — this is a clear timing shift, reintroduction recommended

RE-ENGAGEMENT READINESS (0-10, composite of signals + nurture category):
0-4: Continue monitoring. No action.
5-7: Signal detected. Route to Sub-agent 7B for a contextual soft touch.
8-10: Strong signals across multiple categories. Reintroduce to Agent 1 for fresh research.

REINTRODUCTION CRITERIA (8+ readiness) — ALL must be true:
  At least one Tier 1 signal (directly observable, not inferred)
  Signal is meaningfully different from why they went to nurture originally
  Minimum time since last contact: 30 days for Hot, 60 days for Warm/Cold

OUTPUT FORMAT:
Return valid JSON matching the SignalMonitorResult type. Every assessment must
include at least one signal observation. Readiness 0-4 without signals = insufficient.
Recommendation must be one of: continue_monitoring | soft_touch | reintroduce_to_pipeline | archive.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent7_input: Agent7Input;
}

function buildUserPrompt(input: Agent7Input): string {
  const lines: string[] = [];
  lines.push(`BATCH SCAN — ${input.records.length} active nurture records`);
  lines.push(`Triggered by: ${input.triggered_by}`);
  lines.push('');
  lines.push('## RECORDS TO EVALUATE');

  for (const r of input.records) {
    lines.push('');
    lines.push(`### Record ${r.id} — ${r.company} (${r.vertical}, category=${r.category})`);
    lines.push(`Lead: ${r.leadId}${r.contactName ? `, contact ${r.contactName}` : ''}`);
    lines.push(`Original pain: ${r.originalPain}`);
    lines.push(`Reason in nurture: ${r.reason}`);
    lines.push(`What was tried before: ${r.whatWasTried.join('; ')}`);
    lines.push(`Days since last contact: ${r.daysSinceLastContact}`);
    lines.push(`Touch count: ${r.touchCount}`);
    lines.push(`Current readiness score: ${r.readinessScore}`);
    if (r.signalsFound.length === 0) {
      lines.push('Signals observed since last evaluation: NONE — flag insufficient if you cannot synthesize at least one observation from public sources.');
    } else {
      lines.push('Signals observed since last evaluation:');
      for (const s of r.signalsFound) {
        lines.push(`  - [${s.kind}] ${s.description} (observed ${s.observed_at}${s.source ? `, source: ${s.source}` : ''})`);
      }
    }
  }

  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('For each record above, produce a SignalAssessment. Score relevance per signal (0-10), compute re_engagement_readiness (0-10), and pick exactly one recommendation.');
  lines.push('Apply the strict reintroduction criteria — all three must be true for reintroduction_eligible.');
  lines.push('Return ONLY valid JSON matching SignalMonitorResult. No markdown fences. No explanation.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string): SignalMonitorResult {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned) as SignalMonitorResult;
}

export async function runSignalMonitor(
  ctx: SubAgentContext,
): Promise<SubAgentResult<SignalMonitorResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const agent7Input = inputs.agent7_input;
  const start = Date.now();

  if (agent7Input.records.length === 0) {
    return {
      sub_agent_id: '7A-signal-monitor',
      parent_agent_id: 'agent-7-nurture',
      task_completed: true,
      result: {
        assessments: [],
        batch_summary: {
          records_evaluated: 0, signals_detected: 0,
          reintroduce_count: 0, soft_touch_count: 0, monitor_count: 0, archive_count: 0,
        },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No records to evaluate — empty batch'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(agent7Input), ctx.memory_context);
    const fallback = await executeWithFallback(
      'signal_monitoring',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content);

    return {
      sub_agent_id: '7A-signal-monitor',
      parent_agent_id: 'agent-7-nurture',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used
        ? [`Fallback chain used (${fallback.attempts} attempts)`]
        : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<SignalMonitorResult>(
      '7A-signal-monitor',
      'agent-7-nurture',
      `Signal monitor failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
