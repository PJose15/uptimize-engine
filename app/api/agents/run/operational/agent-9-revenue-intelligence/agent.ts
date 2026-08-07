/**
 * Agent 9 — Revenue Intelligence (Sequential: 9A → 9B)
 * Source: UPTIMIZE_OPERATIONAL_AGENTS_COMPLETE.md (Agent 9)
 */

import { runSequential, buildSubAgentContext } from '@/lib/subagent';
import { loadAgentMemory, commitAgentMemory } from '@/lib/learning/memory';
import type { AgentSynthesisResult, SubAgentResult } from '@/lib/subagent';
import { runPortfolioMonitor } from './subagents/9a-portfolio-monitor';
import { runFinancialMetrics } from './subagents/9b-financial-metrics';
import type {
  Agent9Input,
  RevenueIntelligenceOutput,
  PortfolioMonitorResult,
  FinancialMetricsResult,
} from './types';

export const AGENT_9_SYSTEM_PROMPT = `You are the Revenue Intelligence Agent for Uptimize AI.

WHAT YOU NEVER DO:
- Never estimate revenue — only confirmed retainers and verified payments.
- Never report churned client retainer as active MRR.
- Never extrapolate NRR from < 3 months of data.
- Never present pipeline value as ARR.`;

const TOTAL_TIMEOUT_MS = 90_000;

export async function runAgent9Revenue(
  input: Agent9Input,
  config: { mode?: 'fast' | 'balanced' | 'quality' } = {},
): Promise<AgentSynthesisResult<RevenueIntelligenceOutput>> {
  // Learnings distributed to this agent, delivered into sub-agent memory.
  // Never fatal: a learning-store failure must degrade to no memory
  // rather than fail a run the agent could otherwise complete.
  const memory = await loadAgentMemory('agent-9-revenue-intelligence').catch(err => {
    console.error('[agent-9-revenue-intelligence] could not load memory:', err);
    return { entries: {}, noticeIds: [], keysRead: [] };
  });

  const baseCtx = buildSubAgentContext({
    parentAgentId: 'agent-9-revenue-intelligence',
    subAgentId: '9A-portfolio-monitor',
    clientId: 'system',
    task: 'Portfolio monitor + company financial metrics',
    taskProfile: 'portfolio_monitoring',
    mode: config.mode ?? 'balanced',
    timeBudgetMs: TOTAL_TIMEOUT_MS,
    inputs: { agent9_input: input },
    memoryEntries: memory.entries,
    maxResponseTokens: 5000,
    confidenceRequired: 'high',
  });

  const { output, resultA, resultB } = await runSequential<
    PortfolioMonitorResult,
    FinancialMetricsResult,
    RevenueIntelligenceOutput
  >(baseCtx, {
    pattern: 'sequential',
    totalTimeoutMs: TOTAL_TIMEOUT_MS,
    timeSplitA: 0.55,
    timeSplitB: 0.40,
    runA: (ctx) => runPortfolioMonitor({ ...ctx, sub_agent_id: '9A-portfolio-monitor', task_profile: 'portfolio_monitoring' }),
    runB: (ctx, aResult) => runFinancialMetrics({ ...ctx, sub_agent_id: '9B-financial-metrics', task_profile: 'financial_metrics' }, aResult),
    synthesize: (a, b) => synthesize(a, b),
  });

  const subAgentResults: SubAgentResult<unknown>[] = [resultA, resultB];

  // A failed run leaves its notices pending rather than burning them.
  if (subAgentResults.some(r => r.task_completed)) {
    await commitAgentMemory(memory, { clientId: 'system', agentId: 'agent-9-revenue-intelligence' });
  }
  const totalCost = subAgentResults.reduce((s, r) => s + r.cost_usd, 0);
  const totalDuration = subAgentResults.reduce((s, r) => s + r.duration_ms, 0);
  const requiresHumanAttention = output.pedro_alerts.length > 0;

  return {
    agent_id: 'agent-9-revenue-intelligence',
    final_output: output,
    sub_agent_results: subAgentResults,
    total_cost_usd: totalCost,
    total_duration_ms: totalDuration,
    synthesis_notes: [
      `Active clients: ${output.portfolio.portfolio_summary.total_active_clients}`,
      `MRR: $${output.financials.mrr_usd}, ARR: $${output.financials.arr_usd}`,
      `At-risk clients: ${output.portfolio.portfolio_summary.clients_at_risk}`,
    ],
    overall_confidence: subAgentResults.some(r => r.confidence === 'low')
      ? 'low' : subAgentResults.some(r => r.confidence === 'medium') ? 'medium' : 'high',
    requires_human_attention: requiresHumanAttention,
    human_attention_reason: requiresHumanAttention
      ? output.pedro_alerts.map(a => `[${a.severity}] ${a.description}`).join('; ')
      : undefined,
  };
}

function synthesize(
  a: SubAgentResult<PortfolioMonitorResult>,
  b: SubAgentResult<FinancialMetricsResult>,
): RevenueIntelligenceOutput {
  const portfolio = a.result ?? {
    clients: [],
    portfolio_summary: {
      total_active_clients: 0, total_mrr_usd: 0, avg_health_score: 0,
      clients_at_risk: 0, clients_expansion_ready: 0,
      payments_overdue: 0, total_overdue_amount_usd: 0,
    },
  };
  const financials = b.result ?? {
    mrr_usd: 0, arr_usd: 0,
    nrr_basis: 'insufficient data — sub-agent failed',
    gross_margin_basis: 'insufficient data',
    cac_basis: 'insufficient data',
    ltv_basis: 'insufficient data',
    pipeline_value_usd: 0,
    milestone_progress: { active_milestone: 'proof_of_concept' as const, progress_pct: 0, delta_from_last_week_usd: 0 },
    top_3_revenue_risks: [],
    top_3_revenue_opportunities: [],
  };

  // Pedro alerts from clients past 30-day overdue and 2-week health drops
  const alerts: RevenueIntelligenceOutput['pedro_alerts'] = [];
  for (const c of portfolio.clients) {
    if (c.payment_status === 'overdue_30' || c.payment_status === 'write_off_risk') {
      alerts.push({
        severity: 'P1',
        client_id: c.client_id,
        description: `${c.client_name ?? c.client_id} payment overdue 30+ days`,
      });
    } else if (c.is_at_risk && (c.weeks_below_60 ?? 0) >= 2) {
      alerts.push({
        severity: 'P2',
        client_id: c.client_id,
        description: `${c.client_name ?? c.client_id} health < 60 for ${c.weeks_below_60} weeks — churn risk`,
      });
    }
  }
  if (financials.nrr_pct !== undefined && financials.nrr_pct < 100) {
    alerts.push({
      severity: 'P3',
      description: `NRR dropped to ${financials.nrr_pct.toFixed(1)}% — investigate root cause`,
    });
  }

  return {
    portfolio,
    financials,
    pedro_alerts: alerts,
    generated_at: new Date().toISOString(),
  };
}
