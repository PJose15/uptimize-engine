/**
 * Sub-agent 13A — Scheduling & Calendar Intelligence
 *
 * Function: For every scheduled call, produce a prep brief from latest agent
 *           data (Agent 5 for client calls, Agent 11A for BD).
 *
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 13A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent13Input, CalendarIntelligenceResult } from '../types';

const SYSTEM_PROMPT = `You are the Scheduling & Calendar Intelligence sub-agent for the Uptimize Internal
Operations system.

YOUR SINGLE FUNCTION:
For every scheduled call, produce a prep brief. Client calls use Agent 5 health
data. BD calls use Agent 11A research. You prepare Pedro to be fully informed
before every conversation.

YOU ARE NOT RESPONSIBLE FOR:
- Tracking commitments (13B's domain)
- Scheduling decisions — you produce briefs, Pedro manages his calendar
- Conducting research — pull from existing Agent 5 and 11A outputs

CLIENT CALL PREP BRIEF (per scheduled client call):
  - Client + company
  - Current health score and trend (Agent 5)
  - Last week's headline win (Agent 5 weekly report)
  - What this client is waiting for (commitment tracker)
  - What they need from this call (current stage + health)
  - 3 key talking points (specific, not generic)
  - What NOT to bring up (sensitive history)
  - Suggested opening line (specific to last week's events)

BD CALL PREP BRIEF (per scheduled BD call):
  - Prospect + company
  - Research summary (11A) or research_missing=true if unavailable
  - Shadow ops hypothesis (signals indicating Uptimize-sized problems)
  - Recommended opening angle (specific to observable signals)
  - 3 questions to ask
  - Recommended next step

CALENDAR SUMMARY:
  Calls today / this week counts
  Prep briefs ready vs. missing — flag missing research immediately

OUTPUT FORMAT:
Return valid JSON matching CalendarIntelligenceResult. Every scheduled call must
have a prep brief, OR be flagged in prep_briefs_missing. No markdown fences.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent13_input: Agent13Input;
}

function buildUserPrompt(input: Agent13Input): string {
  const lines: string[] = [];
  lines.push(`Brief date: ${input.date}`);
  lines.push(`Trigger: ${input.trigger}`);
  lines.push('');
  lines.push(`## SCHEDULED CALLS (${input.scheduled_calls.length})`);
  for (const c of input.scheduled_calls) {
    lines.push(`- ${c.call_id} [${c.type}] ${c.counterparty_name} @ ${c.counterparty_company} at ${c.scheduled_at}${c.notes ? ` — ${c.notes}` : ''}`);
  }
  lines.push('');
  if (input.recent_client_signals) {
    lines.push('## RECENT CLIENT SIGNALS (Agent 5 latest)');
    lines.push(JSON.stringify(input.recent_client_signals).slice(0, 4000));
    lines.push('');
  }
  if (input.recent_bd_research) {
    lines.push('## RECENT BD RESEARCH (Agent 11A latest)');
    lines.push(JSON.stringify(input.recent_bd_research).slice(0, 4000));
    lines.push('');
  }
  lines.push('## YOUR TASK');
  lines.push('Produce a CalendarIntelligenceResult JSON. Every call must have a prep brief OR be in prep_briefs_missing.');
  lines.push('Return ONLY valid JSON.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runCalendarIntelligence(
  ctx: SubAgentContext,
): Promise<SubAgentResult<CalendarIntelligenceResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent13_input;
  const start = Date.now();

  if (input.scheduled_calls.length === 0) {
    return {
      sub_agent_id: '13A-calendar-intelligence',
      parent_agent_id: 'agent-13-internal-ops',
      task_completed: true,
      result: {
        client_call_prep_briefs: [],
        bd_call_prep_briefs: [],
        calendar_summary: { calls_today_count: 0, calls_today_names: [], calls_this_week_count: 0, prep_briefs_ready: 0, prep_briefs_missing: [] },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No scheduled calls — empty calendar'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'calendar_intelligence',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as CalendarIntelligenceResult;
    return {
      sub_agent_id: '13A-calendar-intelligence',
      parent_agent_id: 'agent-13-internal-ops',
      task_completed: true,
      result,
      confidence: fallback.fallback_used ? 'medium' : 'high',
      cost_usd: fallback.cost_usd,
      duration_ms: Date.now() - start,
      model_used: fallback.model_used,
      tokens_input: fallback.usage.input_tokens,
      tokens_output: fallback.usage.output_tokens,
      processing_notes: fallback.fallback_used ? [`Fallback used (${fallback.attempts})`] : [],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<CalendarIntelligenceResult>(
      '13A-calendar-intelligence',
      'agent-13-internal-ops',
      `Calendar intelligence failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
