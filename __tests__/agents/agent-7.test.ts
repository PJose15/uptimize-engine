// @vitest-environment node
/**
 * Agent 7: Nurture Intelligence Tests
 *
 * Structural tests with mocked LLM provider — verifies parallel orchestration,
 * synthesis, specific-reason rule, and approval-required enforcement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent7Nurture } from '../../app/api/agents/run/uptimize/agent-7-nurture';
import type {
  Agent7Input,
  SignalMonitorResult,
  SequenceManagerResult,
  NurtureRecordView,
} from '../../app/api/agents/run/uptimize/agent-7-nurture';

const mockedExecute = vi.mocked(executeWithFallback);

function record(over: Partial<NurtureRecordView> = {}): NurtureRecordView {
  return {
    id: 'rec-1',
    leadId: 'lead-1',
    company: 'Acme Fitness',
    contactName: 'Jane Doe',
    vertical: 'fitness',
    category: 'warm',
    reason: 'Wrong timing — Q4 expansion focus',
    originalPain: 'Manual booking via WhatsApp',
    whatWasTried: ['WhatsApp template', 'Calendly link'],
    readinessScore: 5,
    reQualified: false,
    archived: false,
    lastTouch: '2026-04-01T00:00:00Z',
    nextTouch: '2026-05-01T00:00:00Z',
    touchCount: 2,
    signalsFound: [],
    clientId: 'client_test_001',
    daysSinceLastContact: 33,
    ...over,
  };
}

const SIGNALS_HIGH: SignalMonitorResult = {
  assessments: [
    {
      nurture_record_id: 'rec-1',
      lead_id: 'lead-1',
      company: 'Acme Fitness',
      vertical: 'fitness',
      category: 'warm',
      signals_observed: [
        {
          kind: 'job_posting',
          description: 'Posted "Operations Coordinator" role 3 days ago',
          observed_at: '2026-05-01T00:00:00Z',
          source: 'linkedin.com',
          relevance_score: 8,
        },
      ],
      re_engagement_readiness: 8,
      recommendation: 'reintroduce_to_pipeline',
      rationale: 'Operations role posted indicates the WhatsApp pain is now budgeted.',
      reintroduction_eligible: true,
    },
  ],
  batch_summary: {
    records_evaluated: 1, signals_detected: 1,
    reintroduce_count: 1, soft_touch_count: 0, monitor_count: 0, archive_count: 0,
  },
};

const SIGNALS_MED: SignalMonitorResult = {
  assessments: [
    {
      nurture_record_id: 'rec-1',
      lead_id: 'lead-1',
      company: 'Acme Fitness',
      vertical: 'fitness',
      category: 'warm',
      signals_observed: [
        {
          kind: 'social_activity',
          description: 'Founder posted about staff capacity issues',
          observed_at: '2026-05-02T00:00:00Z',
          relevance_score: 6,
        },
      ],
      re_engagement_readiness: 6,
      recommendation: 'soft_touch',
      rationale: 'Capacity-stress signal — appropriate moment for value-add.',
      reintroduction_eligible: false,
    },
  ],
  batch_summary: {
    records_evaluated: 1, signals_detected: 1,
    reintroduce_count: 0, soft_touch_count: 1, monitor_count: 0, archive_count: 0,
  },
};

const TOUCHES_DUE: SequenceManagerResult = {
  touches_due: [
    {
      nurture_record_id: 'rec-1',
      lead_id: 'lead-1',
      company: 'Acme Fitness',
      category: 'warm',
      channel: 'email',
      angle: 'shadow_ops',
      specific_reason: 'You posted an Operations Coordinator role last week — that suggests the WhatsApp coordination pain is now on the budget',
      message_subject: 'Quick thought on the Ops Coordinator hire',
      message_body: 'Saw the job listing — most ops hires we see in fitness are reactions to coordination chaos. Worth a 15-min revisit?',
      message_length: 'two_sentences',
      approval_required: true,
      scheduled_for: '2026-05-04T15:00:00Z',
      next_touch_after_send: '2026-06-03T15:00:00Z',
    },
  ],
  records_archived: [],
  records_updated_next_touch: [],
  batch_summary: { records_due: 1, touches_drafted: 1, archived_count: 0, updated_count: 0 },
};

const TOUCHES_NONE_DUE: SequenceManagerResult = {
  touches_due: [],
  records_archived: [],
  records_updated_next_touch: [
    { nurture_record_id: 'rec-1', new_next_touch: '2026-06-01T00:00:00Z', reason: 'Schedule maintained' },
  ],
  batch_summary: { records_due: 0, touches_drafted: 0, archived_count: 0, updated_count: 1 },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514',
    provider: 'anthropic' as const,
    usage: { input_tokens: 600, output_tokens: 300, total_tokens: 900 },
    cost_usd: 0.02,
    latency_ms: 1200,
    fallback_used: false,
    primary_provider: 'anthropic' as const,
    attempts: 1,
  };
}

describe('Agent 7: Nurture Intelligence', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('routes 8+ readiness with eligible criteria to reintroductions queue', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'signal_monitoring') return fakeFallback(SIGNALS_HIGH);
      return fakeFallback(TOUCHES_NONE_DUE);
    });

    const input: Agent7Input = {
      records: [record()],
      triggered_by: 'cron',
      client_id: 'client_test_001',
    };
    const result = await runAgent7Nurture(input);

    expect(result.final_output.reintroductions).toHaveLength(1);
    expect(result.final_output.reintroductions[0].readiness_score).toBe(8);
    expect(result.final_output.reintroductions[0].requalify_brief).toContain('Acme Fitness');
    expect(result.final_output.approval_queue_entries).toHaveLength(0);
  });

  it('routes drafted touches with specific_reason to approval queue', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'signal_monitoring') return fakeFallback(SIGNALS_MED);
      return fakeFallback(TOUCHES_DUE);
    });

    const input: Agent7Input = {
      records: [record()],
      triggered_by: 'cron',
      client_id: 'client_test_001',
    };
    const result = await runAgent7Nurture(input);

    expect(result.final_output.approval_queue_entries).toHaveLength(1);
    const entry = result.final_output.approval_queue_entries[0];
    expect(entry.drafted_touch.approval_required).toBe(true);
    expect(entry.drafted_touch.specific_reason.length).toBeGreaterThan(20);
  });

  it('drops drafted touches that lack a specific reason', async () => {
    const noReasonTouch: SequenceManagerResult = {
      ...TOUCHES_DUE,
      touches_due: [{ ...TOUCHES_DUE.touches_due[0], specific_reason: '' }],
    };
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'signal_monitoring') return fakeFallback(SIGNALS_MED);
      return fakeFallback(noReasonTouch);
    });

    const result = await runAgent7Nurture({
      records: [record()],
      triggered_by: 'cron',
      client_id: 'client_test_001',
    });

    expect(result.final_output.approval_queue_entries).toHaveLength(0);
  });

  it('escalates P2 when reintroducing without observed signals', async () => {
    const eligibleNoSignals: SignalMonitorResult = {
      ...SIGNALS_HIGH,
      assessments: [{ ...SIGNALS_HIGH.assessments[0], signals_observed: [] }],
    };
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'signal_monitoring') return fakeFallback(eligibleNoSignals);
      return fakeFallback(TOUCHES_NONE_DUE);
    });

    const result = await runAgent7Nurture({
      records: [record()],
      triggered_by: 'cron',
      client_id: 'client_test_001',
    });

    const p2 = result.final_output.escalations.find(e => e.severity === 'P2');
    expect(p2).toBeDefined();
    expect(result.requires_human_attention).toBe(true);
  });

  it('returns empty results immediately for an empty batch (no LLM calls)', async () => {
    const result = await runAgent7Nurture({
      records: [],
      triggered_by: 'cron',
      client_id: 'client_test_001',
    });

    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.final_output.reintroductions).toHaveLength(0);
    expect(result.final_output.approval_queue_entries).toHaveLength(0);
    expect(result.total_cost_usd).toBe(0);
  });
});
