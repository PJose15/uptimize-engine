/**
 * Sub-agent 9B — Financial Metrics Calculator
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Sub-agent 9B)
 */

import { executeWithFallback } from '@/lib/providers/fallback';
import type { SubAgentContext, SubAgentResult } from '@/lib/subagent';
import { buildP1Failure } from '@/lib/subagent';
import type { Agent9Input, FinancialMetricsResult, PortfolioMonitorResult } from '../types';

const SYSTEM_PROMPT = `You are the Financial Metrics Calculator sub-agent for the Uptimize Revenue Intelligence system.

YOUR SINGLE FUNCTION:
Take 9A's portfolio data and calculate company-level metrics. You calculate from
confirmed data only. State "insufficient data" rather than estimating.

CALCULATIONS:
MRR = Σ active retainers
ARR = MRR × 12
NRR = (MRR_start + Expansion - Churned) / MRR_start × 100. Requires 3+ months data.
Gross Margin = (Revenue - Delivery Cost) / Revenue × 100. Delivery = LLM cost + Pedro hours × $150/h.
CAC = acquisition spend / new clients. Requires 3+ acquisitions in period.
LTV = avg retainer × 24 months (current assumption).
Pipeline Value = sum of qualified proposal close values.

MILESTONES (MRR thresholds):
proof_of_concept = $15,000
product_market_fit = $50,000
scale = $100,000
investment_readiness = $250,000

OUTPUT FORMAT:
Return valid JSON matching FinancialMetricsResult. Every metric shows its calculation
basis. State "insufficient data" explicitly when applicable.`;

interface SubAgentBInputs extends Record<string, unknown> {
  agent9_input: Agent9Input;
  sub_agent_a_result?: PortfolioMonitorResult;
}

function buildUserPrompt(input: Agent9Input, portfolio: PortfolioMonitorResult): string {
  const lines: string[] = [];
  lines.push(`Week of: ${input.week_of}`);
  lines.push('');
  lines.push('## PORTFOLIO SUMMARY (from 9A)');
  lines.push(JSON.stringify(portfolio.portfolio_summary, null, 2));
  lines.push('');
  if (input.prior_period_mrr_usd !== undefined) {
    lines.push(`Prior period MRR: $${input.prior_period_mrr_usd}`);
  }
  if (input.expansion_mrr_this_period_usd !== undefined) {
    lines.push(`Expansion MRR this period: $${input.expansion_mrr_this_period_usd}`);
  }
  if (input.churned_mrr_this_period_usd !== undefined) {
    lines.push(`Churned MRR this period: $${input.churned_mrr_this_period_usd}`);
  }
  if (input.delivery_costs) {
    lines.push(`Delivery costs: $${input.delivery_costs.llm_cost_usd} LLM + ${input.delivery_costs.pedro_hours} Pedro hours`);
  }
  if (input.acquisition_costs) {
    lines.push(`Acquisition: $${input.acquisition_costs.total_spend_usd} for ${input.acquisition_costs.new_clients_acquired} new clients`);
  }
  lines.push('');
  lines.push(`## PIPELINE (${input.pipeline_proposals.length} proposals)`);
  for (const p of input.pipeline_proposals) {
    lines.push(`- ${p.proposal_id} (${p.stage}): $${p.estimated_close_value_usd}`);
  }
  lines.push('');
  lines.push('## YOUR TASK');
  lines.push('Calculate all metrics. Return ONLY valid JSON matching FinancialMetricsResult.');
  return lines.join('\n');
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith('```json')) return t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  if (t.startsWith('```')) return t.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return t;
}

export async function runFinancialMetrics(
  ctx: SubAgentContext,
  portfolio: PortfolioMonitorResult,
): Promise<SubAgentResult<FinancialMetricsResult>> {
  const inputs = ctx.inputs as SubAgentBInputs;
  const input = inputs.agent9_input;
  const start = Date.now();

  try {
    const userPrompt = buildUserPrompt(input, portfolio);
    const fallback = await executeWithFallback(
      'financial_metrics',
      {
        messages: [{ role: 'user', content: userPrompt }],
        system: SYSTEM_PROMPT,
        max_tokens: ctx.max_response_tokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      { timeoutMs: ctx.time_budget_ms },
    );

    const result = JSON.parse(stripJsonFences(fallback.content)) as FinancialMetricsResult;
    return {
      sub_agent_id: '9B-financial-metrics',
      parent_agent_id: 'agent-9-revenue-intelligence',
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
        `MRR: $${result.mrr_usd}, ARR: $${result.arr_usd}`,
      ],
      fallbacks_used: fallback.fallback_used ? [fallback.model_used] : [],
      escalation_needed: false,
    };
  } catch (err) {
    return buildP1Failure<FinancialMetricsResult>(
      '9B-financial-metrics',
      'agent-9-revenue-intelligence',
      `Financial metrics failed: ${err instanceof Error ? err.message : String(err)}`,
      Date.now() - start,
    );
  }
}
