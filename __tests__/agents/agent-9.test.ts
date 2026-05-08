// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent9Revenue } from '../../app/api/agents/run/operational/agent-9-revenue-intelligence';
import type {
  Agent9Input,
  PortfolioMonitorResult,
  FinancialMetricsResult,
} from '../../app/api/agents/run/operational/agent-9-revenue-intelligence';

const mockedExecute = vi.mocked(executeWithFallback);

const PORTFOLIO: PortfolioMonitorResult = {
  clients: [
    {
      client_id: 'c-1', client_name: 'Healthy Co', vertical: 'fitness',
      retainer_usd: 1200, retainer_status: 'active', payment_status: 'current',
      health_score: 84, health_trend: 'up', weeks_below_60: 0,
      is_at_risk: false, is_expansion_ready: true, data_gaps: [],
    },
    {
      client_id: 'c-2', client_name: 'At Risk Co', vertical: 'real_estate',
      retainer_usd: 2400, retainer_status: 'active', payment_status: 'overdue_14',
      health_score: 55, health_trend: 'down', weeks_below_60: 3,
      is_at_risk: true, is_expansion_ready: false, data_gaps: [],
    },
    {
      client_id: 'c-3', client_name: 'Big Trouble', vertical: 'logistics',
      retainer_usd: 3600, retainer_status: 'active', payment_status: 'overdue_30',
      health_score: 50, health_trend: 'down', weeks_below_60: 5,
      is_at_risk: true, is_expansion_ready: false, data_gaps: [],
    },
  ],
  portfolio_summary: {
    total_active_clients: 3, total_mrr_usd: 7200, avg_health_score: 63,
    clients_at_risk: 2, clients_expansion_ready: 1,
    payments_overdue: 2, total_overdue_amount_usd: 6000,
  },
};

const FINANCIALS: FinancialMetricsResult = {
  mrr_usd: 7200, arr_usd: 86400,
  nrr_basis: 'insufficient data — need 3+ months',
  gross_margin_pct: 78, gross_margin_basis: 'Calculated from delivery costs',
  cac_basis: 'insufficient data',
  ltv_usd: 28800, ltv_basis: 'Avg retainer × 24 months',
  pipeline_value_usd: 12000,
  milestone_progress: {
    active_milestone: 'proof_of_concept',
    progress_pct: 48, estimated_months_to_milestone: 4,
    delta_from_last_week_usd: 600,
  },
  top_3_revenue_risks: [{ description: 'Client c-3 30+ days overdue', impact_usd: 3600 }],
  top_3_revenue_opportunities: [{ description: 'Client c-1 expansion ready', potential_usd: 1200 }],
};

const FINANCIALS_NRR_LOW: FinancialMetricsResult = {
  ...FINANCIALS,
  nrr_pct: 88,
  nrr_basis: 'Calculated from 3 months data',
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'gemini-2.0-flash', provider: 'gemini' as const,
    usage: { input_tokens: 600, output_tokens: 400, total_tokens: 1000 },
    cost_usd: 0.02, latency_ms: 1200,
    fallback_used: false, primary_provider: 'gemini' as const, attempts: 1,
  };
}

const INPUT: Agent9Input = {
  trigger: 'cron_weekly',
  week_of: '2026-05-04',
  active_clients: [
    { client_id: 'c-1', retainer_usd: 1200, retainer_status: 'active', health_score: 84 },
    { client_id: 'c-2', retainer_usd: 2400, retainer_status: 'active', health_score: 55, weeks_below_60: 3 },
    { client_id: 'c-3', retainer_usd: 3600, retainer_status: 'active', health_score: 50, weeks_below_60: 5 },
  ],
  payments: [],
  pipeline_proposals: [{ proposal_id: 'p1', client_id: 'pipeline-1', estimated_close_value_usd: 12000, stage: 'negotiating' }],
};

describe('Sprint 13 — Agent 9 Revenue Intelligence (sequential)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('emits P1 alert for 30+ days overdue client and P2 for sustained health drop', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PORTFOLIO))
      .mockResolvedValueOnce(fakeFallback(FINANCIALS));

    const result = await runAgent9Revenue(INPUT);

    const p1 = result.final_output.pedro_alerts.find(a => a.severity === 'P1');
    const p2 = result.final_output.pedro_alerts.find(a => a.severity === 'P2');
    expect(p1).toBeDefined();
    expect(p1?.client_id).toBe('c-3');
    expect(p2).toBeDefined();
    expect(result.requires_human_attention).toBe(true);
  });

  it('emits P3 NRR alert when NRR below 100%', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(PORTFOLIO))
      .mockResolvedValueOnce(fakeFallback(FINANCIALS_NRR_LOW));

    const result = await runAgent9Revenue(INPUT);
    const p3 = result.final_output.pedro_alerts.find(a => a.severity === 'P3' && a.description.includes('NRR'));
    expect(p3).toBeDefined();
  });
});
