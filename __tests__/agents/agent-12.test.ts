// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent12Compliance } from '../../app/api/agents/run/operational/agent-12-compliance';
import type {
  Agent12Input,
  ComplianceTrackerResult,
  InvoiceManagerResult,
} from '../../app/api/agents/run/operational/agent-12-compliance';

const mockedExecute = vi.mocked(executeWithFallback);

const COMPLIANCE: ComplianceTrackerResult = {
  contracts: [
    {
      client_id: 'client-1', client_name: 'Healthcare Co',
      contract_start: '2026-01-01', renewal_date: '2026-05-15',
      notice_period_days: 30, baa_required: true, baa_signed_at: '2026-01-01',
      baa_expiry: '2026-04-30', nda_signed: true, data_handling_in_sow: true,
      status: 'active', days_to_renewal: 10,
    },
  ],
  alerts: [
    {
      urgency: 'P1', client_id: 'client-1', client_name: 'Healthcare Co',
      category: 'baa', issue: 'BAA expired 2026-04-30',
      due_by: '2026-04-30',
      recommended_action: 'Stop healthcare work until BAA renewed',
    },
    {
      urgency: 'P2', client_id: 'client-1', client_name: 'Healthcare Co',
      category: 'renewal', issue: 'Contract renewal in 10 days',
      due_by: '2026-05-15',
      recommended_action: 'Confirm renewal decision',
    },
  ],
  forward_view_60_days: {
    renewals_due: [{ client_id: 'client-1', client_name: 'Healthcare Co', due_by: '2026-05-15', urgency: 'P2' }],
    baa_renewals_due: [{ client_id: 'client-1', client_name: 'Healthcare Co', due_by: '2026-04-30', urgency: 'P1' }],
    other_deadlines: [],
  },
};

const INVOICES: InvoiceManagerResult = {
  invoices_generated: [
    { invoice_id: 'inv-new', client_id: 'client-2', invoice_number: 'INV-2026-005',
      amount_usd: 2400, due_date: '2026-05-12',
      line_items: [{ description: 'Monthly retainer May 2026', amount_usd: 2400 }],
      payment_status: 'pending' },
  ],
  overdue_items: [
    { invoice_id: 'inv-old', client_id: 'client-3', client_name: 'Stale Co',
      amount_usd: 1200, due_date: '2026-04-04', days_overdue: 31,
      bucket: '30+', action_recommended: 'Pedro contacts directly', followup_count: 3,
      approval_required: true },
  ],
  receivables_position: {
    total_outstanding_usd: 3600, current_usd: 2400,
    overdue_1_7_usd: 0, overdue_8_14_usd: 0, overdue_15_29_usd: 0, overdue_30_plus_usd: 1200,
    clients_by_bucket: { current: ['client-2'], '1-7': [], '8-14': [], '15-29': [], '30+': ['client-3'] },
  },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514', provider: 'anthropic' as const,
    usage: { input_tokens: 600, output_tokens: 400, total_tokens: 1000 },
    cost_usd: 0.03, latency_ms: 1500,
    fallback_used: false, primary_provider: 'anthropic' as const, attempts: 1,
  };
}

const INPUT: Agent12Input = {
  trigger: 'cron_daily',
  today: '2026-05-05',
  contracts: [{
    client_id: 'client-1', client_name: 'Healthcare Co',
    contract_start: '2026-01-01', renewal_date: '2026-05-15',
    baa_required: true, baa_signed_at: '2026-01-01', baa_expiry: '2026-04-30',
  }],
  invoices: [
    { invoice_id: 'inv-old', client_id: 'client-3', invoice_number: 'INV-001',
      amount_usd: 1200, due_date: '2026-04-04', payment_status: 'overdue', followup_count: 3 },
  ],
};

describe('Sprint 13 — Agent 12 Compliance (sequential)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('surfaces P1 BAA-expired alert + 30+ overdue invoice for Pedro', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(COMPLIANCE))
      .mockResolvedValueOnce(fakeFallback(INVOICES));

    const result = await runAgent12Compliance(INPUT);

    expect(result.final_output.pedro_alerts.length).toBeGreaterThanOrEqual(2);
    const baaP1 = result.final_output.pedro_alerts.find(a => a.category === 'baa' && a.urgency === 'P1');
    expect(baaP1).toBeDefined();
    const overdueP1 = result.final_output.pedro_alerts.find(a => a.urgency === 'P1' && a.issue.includes('overdue'));
    expect(overdueP1).toBeDefined();
    expect(result.requires_human_attention).toBe(true);
  });

  it('reports receivables position with bucketed totals', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(COMPLIANCE))
      .mockResolvedValueOnce(fakeFallback(INVOICES));

    const result = await runAgent12Compliance(INPUT);

    expect(result.final_output.invoices.receivables_position.total_outstanding_usd).toBe(3600);
    expect(result.final_output.invoices.receivables_position.overdue_30_plus_usd).toBe(1200);
    expect(result.final_output.invoices.overdue_items[0].approval_required).toBe(true);
  });
});
