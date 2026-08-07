/**
 * Sub-agent 11B — Pipeline Stage Manager
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 11B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import { withMemoryContext } from '@/lib/subagent/context-builder';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent11Input, PipelineStageManagerResult } from '../types';

const SYSTEM_PROMPT = `You are the Pipeline Stage Manager sub-agent for the Uptimize BD system.

YOUR SINGLE FUNCTION:
Track every active prospect / partner / referral. Flag what is stalling (7+ days
no movement). Produce the daily digest content.

YOU ARE NOT RESPONSIBLE FOR:
- Researching prospects (11A)
- Producing pre-call briefs (11A)

KEY RULES:
- Warm referrals MUST be acted on within 48 hours of introduction
- 7+ days no movement = stalled
- Calculate weekly metrics: calls_booked, proposals_in_close, referrals_active, pipeline_value

OUTPUT FORMAT:
Return valid JSON matching PipelineStageManagerResult.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent11_input: Agent11Input;
}

function buildUserPrompt(input: Agent11Input): string {
  const lines: string[] = [];
  lines.push(`Today: ${input.today}`);
  lines.push('');
  lines.push(`## ACTIVE BD RECORDS (${input.records.length})`);
  for (const r of input.records) {
    lines.push(`- ${r.id} [${r.type}/${r.current_stage}] ${r.company_name}: $${r.pipeline_value_usd}, last contact ${r.days_since_last_contact ?? 'unknown'}d ago, next: ${r.next_action ?? 'none'}${r.next_action_due ? ` (due ${r.next_action_due})` : ''}${r.referred_by ? `, referred by ${r.referred_by}` : ''}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Categorize records into: actions_today, stalled, new_referrals, partnerships_in_progress.');
  lines.push('Compute weekly_metrics. Return ONLY valid JSON.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runBdPipelineManager(
  ctx: SubAgentContext,
): Promise<SubAgentResult<PipelineStageManagerResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.agent11_input;
  const start = Date.now();

  if (input.records.length === 0) {
    return {
      sub_agent_id: '11B-pipeline-manager-bd',
      parent_agent_id: 'agent-11-business-development',
      task_completed: true,
      result: {
        records: [], actions_today: [], stalled: [], new_referrals: [], partnerships_in_progress: [],
        weekly_metrics: { calls_booked: 0, proposals_in_close: 0, referrals_active: 0, pipeline_value_usd: 0 },
      },
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
    // Learned context from previous runs, filtered to this sub-agent's
    // permitted memory keys by buildSubAgentContext.
    const userPrompt = withMemoryContext(buildUserPrompt(input), ctx.memory_context);
    const fallback = await executeWithFallback(
      'pipeline_stage_mgmt',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as PipelineStageManagerResult;
    return {
      sub_agent_id: '11B-pipeline-manager-bd',
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
      escalation_needed: result.new_referrals.length > 0,
      escalation_severity: result.new_referrals.length > 0 ? 'P2' : undefined,
      escalation_reason: result.new_referrals.length > 0
        ? `${result.new_referrals.length} new referral(s) — must contact within 48h`
        : undefined,
    };
  } catch (err) {
    return buildP1Failure<PipelineStageManagerResult>(
      '11B-pipeline-manager-bd',
      'agent-11-business-development',
      `BD pipeline manager failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
