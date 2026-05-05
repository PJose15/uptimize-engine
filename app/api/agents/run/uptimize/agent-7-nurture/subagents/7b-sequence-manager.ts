/**
 * Sub-agent 7B — Nurture Sequence Manager
 *
 * Function: Schedule due touches and draft specific content per record.
 * NOT responsible for: detecting signals, scoring readiness, sending messages.
 *
 * Source: UPTIMIZE_AGENT_PROMPTS_PIPELINE_V2.md (Sub-agent 7B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent7Input, SequenceManagerResult } from '../types';

const SYSTEM_PROMPT = `You are the Nurture Sequence Manager sub-agent for the Uptimize Nurture Intelligence system.

YOUR SINGLE FUNCTION:
Manage the timing and draft the specific content for every touch due in this batch.
You schedule and write. You do not detect signals (that is Sub-agent 7A). You do not
send anything — all touches go through the approval queue.

YOU ARE NOT RESPONSIBLE FOR:
- Detecting or evaluating new signals (that is Sub-agent 7A's function)
- Making re-qualification decisions (that is based on 7A's readiness score)
- Sending any message without approval — approval is always required

TOUCH SCHEDULING RULES:
Hot Nurture: Touch due if 14+ days since last contact
Warm Nurture: Touch due if 30+ days since last contact
Cold Nurture: Touch due if 90+ days since last contact
Lost Deal: Touch due if 60+ days since last contact AND a new signal was observed

TOUCH CONTENT RULES — THE SPECIFIC REASON RULE:
Every message must complete this sentence:
"I'm reaching out specifically because [observable development] makes this moment
different from when we last spoke."
If you cannot complete that sentence with something real, the touch is not ready.
Do not schedule a touch that has no specific reason.

ANGLE ROTATION:
Track what angles have been used for this prospect. Never repeat an angle consecutively.
Available angles: shadow_ops / exception_cost / audit_trail / knowledge_bottleneck /
handoff_failure / channel_scatter / vertical_trigger / competitor_signal / proof_result

CONTENT BY CATEGORY:
Hot Nurture: Brief and specific. Reference the Money Leak Map number they saw.
  "The $[X]/month we identified in [pillar] hasn't changed. Has the timing?"
Warm Nurture: Value-add first, ask second. Lead with something useful for their vertical.
Cold Nurture: Purely informational. An industry development relevant to their problem.
  No sales language. Just a relevant insight.
Lost Deal: Maximum 2 sentences. New development only. Respectful closing option included.

MESSAGE FORMATTING:
Max length: One_liner (1 sentence) | Two_sentences (2) | Short_paragraph (3-4 sentences)
  Hot: Two_sentences max
  Warm: Short_paragraph max
  Cold: Two_sentences max (not intrusive)
  Lost Deal: One_liner max (respectful, not desperate)

NEXT TOUCH WINDOW:
After scheduling a touch, set the next_touch_after_send to:
  Hot: +14 days   Warm: +30 days   Cold: +90 days   Lost Deal: +60 days

ARCHIVAL CRITERIA:
A record should be archived if any are true:
  - 4 consecutive touches with no engagement
  - 12 months in nurture with no readiness > 4
  - Hot category beyond 6 months without conversion
  - Lost Deal beyond 12 months with no new signal

OUTPUT FORMAT:
Return valid JSON matching the SequenceManagerResult type. Every touch in the
touches_due array must have approval_required: true. This is not configurable.
All external sends require human approval. No exceptions.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent7_input: Agent7Input;
}

function buildUserPrompt(input: Agent7Input): string {
  const lines: string[] = [];
  lines.push(`BATCH PROCESSING — ${input.records.length} nurture records`);
  lines.push(`Triggered by: ${input.triggered_by}`);
  lines.push('');
  lines.push('## RECORDS TO EVALUATE FOR DUE TOUCHES');

  for (const r of input.records) {
    lines.push('');
    lines.push(`### Record ${r.id} — ${r.company} (${r.vertical}, category=${r.category})`);
    lines.push(`Lead: ${r.leadId}`);
    lines.push(`Original pain: ${r.originalPain}`);
    lines.push(`Reason in nurture: ${r.reason}`);
    lines.push(`What was tried before: ${r.whatWasTried.join('; ')}`);
    lines.push(`Days since last contact: ${r.daysSinceLastContact}`);
    lines.push(`Touch count: ${r.touchCount}`);
    if (r.signalsFound.length > 0) {
      lines.push('Recent observable developments:');
      for (const s of r.signalsFound) {
        lines.push(`  - [${s.kind}] ${s.description}`);
      }
    } else {
      lines.push('Recent observable developments: NONE.');
    }
  }

  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Determine which records are due a touch (per scheduling rules).');
  lines.push('For each due record: draft the touch with a specific_reason that completes the required sentence.');
  lines.push('If no specific reason exists for a record, do NOT include it in touches_due — instead update next_touch.');
  lines.push('Apply archival criteria — list records to archive in records_archived with reason.');
  lines.push('For all other records (not due, not archived), include in records_updated_next_touch with the next scheduled date.');
  lines.push('Return ONLY valid JSON matching SequenceManagerResult. No markdown fences.');

  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

function parseResult(text: string): SequenceManagerResult {
  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned) as SequenceManagerResult;
  // Enforce approval_required on every touch
  for (const t of parsed.touches_due) {
    t.approval_required = true;
  }
  return parsed;
}

export async function runSequenceManager(
  ctx: SubAgentContext,
): Promise<SubAgentResult<SequenceManagerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const agent7Input = inputs.agent7_input;
  const start = Date.now();

  if (agent7Input.records.length === 0) {
    return {
      sub_agent_id: '7B-sequence-manager',
      parent_agent_id: 'agent-7-nurture',
      task_completed: true,
      result: {
        touches_due: [],
        records_archived: [],
        records_updated_next_touch: [],
        batch_summary: { records_due: 0, touches_drafted: 0, archived_count: 0, updated_count: 0 },
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
    const userPrompt = buildUserPrompt(agent7Input);
    const fallback = await executeWithFallback(
      'sequence_management',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = parseResult(fallback.content);

    return {
      sub_agent_id: '7B-sequence-manager',
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
        ? [`Fallback used (${fallback.attempts} attempts)`]
        : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<SequenceManagerResult>(
      '7B-sequence-manager',
      'agent-7-nurture',
      `Sequence manager failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
