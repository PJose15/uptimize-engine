/**
 * Sub-agent 13B — Deliverable & Commitment Tracker
 *
 * Function: Track every open commitment, surface what's due/overdue/at-risk,
 *           apply overload detection.
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 13B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent13Input, DeliverableTrackerResult } from '../types';

const SYSTEM_PROMPT = `You are the Deliverable & Commitment Tracker sub-agent for the Uptimize Internal
Operations system.

YOUR SINGLE FUNCTION:
Track every open commitment. Surface what is due today, overdue, and at risk.
Apply overload detection. You track and alert. You do not produce prep briefs (13A).

PRIORITY FRAMEWORK:
P1 — Overdue. Past due_date with no completion. Escalate immediately.
P2 — Due today.
P3 — Due this week.
P4 — Due next week. Awareness only.

OVERLOAD DETECTION:
If more than 5 P1/P2 commitments are due on the same day → flag as overloaded.
Produce triage: which 3 must happen today, which can be deferred WITH a specific
client/partner communication explaining the delay.

DAILY FOCUS LIST:
The top 5 actions Pedro should take today.
Each action: specific, actionable, estimated_minutes (realistic).
Not a wishlist — a realistic daily plan.

RECOMMENDED ACTIONS:
For P1 and P2 commitments, every commitment must have a recommended_action.
"Monitor" is not an action.
"Contact [person] about [specific item]" is an action.

OUTPUT FORMAT:
Return valid JSON matching DeliverableTrackerResult. No markdown fences.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent13_input: Agent13Input;
}

function buildUserPrompt(input: Agent13Input): string {
  const lines: string[] = [];
  lines.push(`Brief date: ${input.date}`);
  lines.push('');
  lines.push(`## OPEN COMMITMENTS (${input.open_commitments.length})`);
  for (const c of input.open_commitments) {
    lines.push(`- [${c.priority}] ${c.id}: "${c.description}" → ${c.committed_to} (${c.committed_to_type}), due ${c.due_date}, source=${c.source}${c.days_overdue ? `, overdue ${c.days_overdue}d` : ''}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Categorize commitments into due_today / overdue / this_week. Apply overload detection.');
  lines.push('Produce a daily_focus_list of top 5 actions with realistic estimated_minutes.');
  lines.push('Every P1 and P2 commitment must have a specific recommended_action.');
  lines.push('Return ONLY valid JSON matching DeliverableTrackerResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runDeliverableTracker(
  ctx: SubAgentContext,
): Promise<SubAgentResult<DeliverableTrackerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.agent13_input;
  const start = Date.now();

  if (input.open_commitments.length === 0) {
    return {
      sub_agent_id: '13B-deliverable-tracker',
      parent_agent_id: 'agent-13-internal-ops',
      task_completed: true,
      result: {
        open_commitments: [], due_today: [], overdue: [], this_week: [],
        daily_focus_list: [],
        overload_triage: { is_overloaded: false, overdue_or_today_count: 0, must_happen_today: [], can_be_deferred: [] },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No open commitments'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'commitment_capture',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as DeliverableTrackerResult;
    return {
      sub_agent_id: '13B-deliverable-tracker',
      parent_agent_id: 'agent-13-internal-ops',
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
        ...(result.overload_triage.is_overloaded ? ['Overloaded — triage required'] : []),
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: result.overload_triage.is_overloaded,
      escalation_severity: result.overload_triage.is_overloaded ? 'P2' : undefined,
      escalation_reason: result.overload_triage.is_overloaded
        ? `${result.overload_triage.overdue_or_today_count} P1/P2 commitments — overload triage required`
        : undefined,
    };
  } catch (err) {
    return buildP1Failure<DeliverableTrackerResult>(
      '13B-deliverable-tracker',
      'agent-13-internal-ops',
      `Deliverable tracker failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
