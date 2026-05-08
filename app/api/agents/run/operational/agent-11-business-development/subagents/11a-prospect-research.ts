/**
 * Sub-agent 11A — Prospect Research
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 11A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent11Input, ProspectResearchResult } from '../types';

const SYSTEM_PROMPT = `You are the Prospect Research sub-agent for the Uptimize Business Development system.

YOUR SINGLE FUNCTION:
Research BD prospects with Agent 1's shadow ops detection methodology before any
BD call. Produce a pre-call brief per upcoming call. Pedro never enters a BD
conversation unprepared.

YOU ARE NOT RESPONSIBLE FOR:
- Pipeline stage management (11B)
- Producing the daily digest (11B)
- Making contact with prospects

PER-PROSPECT BRIEF MUST INCLUDE:
- Shadow ops signals observed (be specific — what evidence)
- Shadow ops hypothesis (what underlying pattern explains the signals)
- Observable pain evidence (1-3 items, with source)
- Recommended opening angle (specific, not generic)
- 3 questions to ask
- Uptimize fit score 0-10

If a record lacks enough data to research, list it in research_missing_for.

OUTPUT FORMAT:
Return valid JSON matching ProspectResearchResult.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent11_input: Agent11Input;
}

function buildUserPrompt(input: Agent11Input): string {
  const lines: string[] = [];
  lines.push(`Today: ${input.today}`);
  lines.push('');
  lines.push(`## UPCOMING BD CALLS (${input.upcoming_calls.length})`);
  for (const c of input.upcoming_calls) {
    const record = input.records.find(r => r.id === c.bd_record_id);
    lines.push(`- ${c.bd_record_id}: ${c.counterparty_name} at ${c.scheduled_at}`);
    if (record) {
      lines.push(`  Company: ${record.company_name}, vertical: ${record.vertical ?? 'unknown'}, stage: ${record.current_stage}`);
    }
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('For every upcoming call (or stalled prospect needing fresh research), produce a BdResearchBrief.');
  lines.push('Records without enough data to research → research_missing_for.');
  lines.push('Return ONLY valid JSON.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runProspectResearch(
  ctx: SubAgentContext,
): Promise<SubAgentResult<ProspectResearchResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent11_input;
  const start = Date.now();

  if (input.upcoming_calls.length === 0 && input.records.length === 0) {
    return {
      sub_agent_id: '11A-prospect-research',
      parent_agent_id: 'agent-11-business-development',
      task_completed: true,
      result: { briefs: [], research_missing_for: [] },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0, tokens_output: 0,
      processing_notes: ['No BD records'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'prospect_research',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as ProspectResearchResult;
    return {
      sub_agent_id: '11A-prospect-research',
      parent_agent_id: 'agent-11-business-development',
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
    return buildP1Failure<ProspectResearchResult>(
      '11A-prospect-research',
      'agent-11-business-development',
      `Prospect research failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
