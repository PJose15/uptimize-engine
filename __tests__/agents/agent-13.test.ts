// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent13InternalOperations } from '../../app/api/agents/run/operational/agent-13-internal-ops';
import type {
  Agent13Input,
  CalendarIntelligenceResult,
  DeliverableTrackerResult,
} from '../../app/api/agents/run/operational/agent-13-internal-ops';

const mockedExecute = vi.mocked(executeWithFallback);

const CALENDAR: CalendarIntelligenceResult = {
  client_call_prep_briefs: [
    {
      client_name: 'Test Client',
      company: 'Acme',
      scheduled_at: '2026-05-05T15:00:00Z',
      current_health_score: 78,
      health_trend: 'up',
      what_client_needs_from_call: 'Review weekly metrics',
      three_key_talking_points: ['Audit gap', 'Reschedule flow', 'Q3 plans'],
      what_not_to_bring_up: [],
      suggested_opening_line: 'Last week your audit completeness hit 94%.',
    },
  ],
  bd_call_prep_briefs: [],
  calendar_summary: {
    calls_today_count: 1,
    calls_today_names: ['Test Client'],
    calls_this_week_count: 3,
    prep_briefs_ready: 1,
    prep_briefs_missing: [],
  },
};

const DELIVERABLES: DeliverableTrackerResult = {
  open_commitments: [
    {
      id: 'cm-1', description: 'Send updated audit report',
      committed_to: 'Test Client', committed_to_type: 'client',
      due_date: '2026-05-05T00:00:00Z', status: 'open', priority: 'P2',
      source: 'call_note', recommended_action: 'Email report by 3pm',
    },
  ],
  due_today: ['cm-1'], overdue: [], this_week: ['cm-1'],
  daily_focus_list: [
    { action: 'Email audit report to Test Client', estimated_minutes: 20, related_commitment_id: 'cm-1' },
  ],
  overload_triage: { is_overloaded: false, overdue_or_today_count: 1, must_happen_today: ['cm-1'], can_be_deferred: [] },
};

const OVERLOADED: DeliverableTrackerResult = {
  ...DELIVERABLES,
  open_commitments: Array.from({ length: 8 }, (_, i) => ({
    id: `cm-${i + 1}`, description: `Item ${i + 1}`,
    committed_to: 'Various', committed_to_type: 'client' as const,
    due_date: '2026-05-05T00:00:00Z', status: 'open' as const, priority: 'P2' as const,
    source: 'call_note',
  })),
  due_today: ['cm-1', 'cm-2', 'cm-3', 'cm-4', 'cm-5', 'cm-6', 'cm-7', 'cm-8'],
  overload_triage: {
    is_overloaded: true, overdue_or_today_count: 8,
    must_happen_today: ['cm-1', 'cm-2', 'cm-3'],
    can_be_deferred: [
      { commitment_id: 'cm-4', suggested_communication: 'Defer 2 days, send note' },
      { commitment_id: 'cm-5', suggested_communication: 'Defer 1 day' },
    ],
  },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514', provider: 'anthropic' as const,
    usage: { input_tokens: 500, output_tokens: 400, total_tokens: 900 },
    cost_usd: 0.02, latency_ms: 1000,
    fallback_used: false, primary_provider: 'anthropic' as const, attempts: 1,
  };
}

const INPUT: Agent13Input = {
  trigger: 'daily_brief',
  date: '2026-05-05',
  scheduled_calls: [
    { call_id: 'c1', type: 'client_call', counterparty_name: 'Test Client', counterparty_company: 'Acme', scheduled_at: '2026-05-05T15:00:00Z' },
  ],
  open_commitments: [
    {
      id: 'cm-1', description: 'Send updated audit report',
      committed_to: 'Test Client', committed_to_type: 'client',
      due_date: '2026-05-05T00:00:00Z', status: 'open', priority: 'P2',
      source: 'call_note',
    },
  ],
  external_alerts: { content: { pending_approval: 2, published_this_week: 1 } },
};

describe('Sprint 13 — Agent 13 Internal Operations (parallel)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces a daily brief with priority, calls, commitments, alerts', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'calendar_intelligence') return fakeFallback(CALENDAR);
      return fakeFallback(DELIVERABLES);
    });

    const result = await runAgent13InternalOperations(INPUT);

    expect(result.final_output.daily_brief.todays_priority).toBeTruthy();
    expect(result.final_output.daily_brief.todays_calls).toHaveLength(1);
    expect(result.final_output.daily_brief.open_commitments_summary).toHaveLength(1);
    expect(result.final_output.daily_brief.is_overloaded).toBe(false);
    expect(result.final_output.daily_brief.quick_alerts.content[0]).toContain('pending');
  });

  it('flags overload when 13B reports >5 P1/P2 due today', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'calendar_intelligence') return fakeFallback(CALENDAR);
      return fakeFallback(OVERLOADED);
    });

    const result = await runAgent13InternalOperations(INPUT);

    expect(result.final_output.daily_brief.is_overloaded).toBe(true);
    expect(result.final_output.daily_brief.overload_triage_recommendation).toContain('focus on 3');
    expect(result.requires_human_attention).toBe(true);
  });
});
