/**
 * Sub-agent 9A — Portfolio Monitor
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 9A)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent9Input, PortfolioMonitorResult } from '../types';

const SYSTEM_PROMPT = `You are the Portfolio Monitor sub-agent for the Uptimize Revenue Intelligence system.

YOUR SINGLE FUNCTION:
Review every active client and produce a portfolio-level health picture per client.
You assess retainer status, payment status, churn risk, expansion readiness.
You do NOT calculate MRR/ARR/NRR (9B's job).

CHURN RISK SIGNALS (any 1+ → at_risk=true):
- Health score below 60 for 2+ consecutive weeks
- Approval queue idle 7+ days
- Weekly report unread for 3+ weeks
- Payment overdue 14+ days

EXPANSION READY: health_score > 70 AND 3+ weeks above 70 AND retainer active.

DATA GAPS:
If a client is missing health_score / payment data — flag as a data gap.
Never estimate. Report the gap explicitly.

OUTPUT FORMAT:
Return valid JSON matching PortfolioMonitorResult. Every client must have a complete entry.`;

interface SubAgentAInputs extends Record<string, unknown> {
  agent9_input: Agent9Input;
}

function buildUserPrompt(input: Agent9Input): string {
  const lines: string[] = [];
  lines.push(`Week of: ${input.week_of}`);
  lines.push(`Trigger: ${input.trigger}`);
  lines.push('');
  lines.push(`## ACTIVE CLIENTS (${input.active_clients.length})`);
  for (const c of input.active_clients) {
    lines.push(`- ${c.client_id}${c.client_name ? ` (${c.client_name})` : ''}: $${c.retainer_usd}/mo (${c.retainer_status}), health=${c.health_score ?? 'unknown'} (${c.health_trend ?? 'unknown'}), weeks<60=${c.weeks_below_60 ?? 0}, queue idle ${c.approval_queue_idle_days ?? 0}d, report unread ${c.weekly_report_unread_weeks ?? 0}wk`);
  }
  lines.push('');
  lines.push(`## PAYMENT STATUS (${input.payments.length} invoices)`);
  for (const p of input.payments) {
    lines.push(`- ${p.client_id}: $${p.amount_usd} due ${p.due_date}${p.paid_at ? ` (paid ${p.paid_at})` : p.days_overdue ? ` (overdue ${p.days_overdue}d)` : ''}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Produce PortfolioMonitorResult with per-client records and the portfolio summary.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runPortfolioMonitor(
  ctx: SubAgentContext,
): Promise<SubAgentResult<PortfolioMonitorResult>> {
  const inputs = ctx.inputs as SubAgentAInputs;
  const input = inputs.agent9_input;
  const start = Date.now();

  if (input.active_clients.length === 0) {
    return {
      sub_agent_id: '9A-portfolio-monitor',
      parent_agent_id: 'agent-9-revenue-intelligence',
      task_completed: true,
      result: {
        clients: [],
        portfolio_summary: {
          total_active_clients: 0, total_mrr_usd: 0, avg_health_score: 0,
          clients_at_risk: 0, clients_expansion_ready: 0,
          payments_overdue: 0, total_overdue_amount_usd: 0,
        },
      },
      confidence: 'high',
      cost_usd: 0,
      duration_ms: 0,
      model_used: 'none',
      tokens_input: 0,
      tokens_output: 0,
      processing_notes: ['No active clients'],
      fallbacks_used: [],
      escalation_needed: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(input);
    const fallback = await executeWithFallback(
      'portfolio_monitoring',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as PortfolioMonitorResult;
    return {
      sub_agent_id: '9A-portfolio-monitor',
      parent_agent_id: 'agent-9-revenue-intelligence',
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
    return buildP1Failure<PortfolioMonitorResult>(
      '9A-portfolio-monitor',
      'agent-9-revenue-intelligence',
      `Portfolio monitor failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
