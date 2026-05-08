// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent10Content } from '../../app/api/agents/run/operational/agent-10-content';
import type {
  Agent10Input,
  ResearchFinderResult,
  DrafterPublisherResult,
} from '../../app/api/agents/run/operational/agent-10-content';

const mockedExecute = vi.mocked(executeWithFallback);

const RESEARCH: ResearchFinderResult = {
  angles: [
    {
      angle_id: 'a1',
      angle_summary: 'A fitness studio in PR cut WhatsApp coordination from 14h/wk to 0h.',
      content_type: 'linkedin_post',
      source: 'agent5_recent_win',
      source_insight: 'Recent client weekly report — anonymized',
      why_now: 'Just confirmed at 60-day mark',
      target_audience: 'Fitness studio owners and operators',
      estimated_resonance_0_10: 8,
      vertical: 'fitness',
    },
  ],
  research_notes: 'Strong proof point this week',
};

// LLM tries to claim approved (which is forbidden) — synthesizer must override
const DRAFTS_TRYING_TO_APPROVE: DrafterPublisherResult = {
  drafts: [
    {
      draft_id: 'd1',
      angle_id: 'a1',
      content_type: 'linkedin_post',
      platform: 'linkedin',
      body_text: 'A fitness studio in PR spent 14 hours every week managing WhatsApp confirmations. After 60 days that number was zero. The fix: a single intake hook that put every booking into the system of record, with audit events on every reschedule. The result: 14 hours back, plus the audit trail to prove it. If you run a studio and your front desk lives in WhatsApp, that pattern is yours.',
      word_count: 75,
      approval_status: 'approved',  // FORBIDDEN — synthesizer must downgrade
      source_insight: 'Recent client weekly report',
    },
  ],
  calendar_status: { scheduled_count: 0, pending_review_count: 1, published_this_week: 0, weeks_of_queue_remaining: 0.3, queue_low_warning: true },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'claude-sonnet-4-20250514', provider: 'anthropic' as const,
    usage: { input_tokens: 800, output_tokens: 600, total_tokens: 1400 },
    cost_usd: 0.04, latency_ms: 1800,
    fallback_used: false, primary_provider: 'anthropic' as const, attempts: 1,
  };
}

const INPUT: Agent10Input = {
  trigger: 'cron_weekly',
  week_of: '2026-05-04',
  source_inputs: {
    agent5_recent_wins: [
      { client_anonymized_label: 'fitness studio in PR', metric_before: '14h/wk', metric_after: '0h/wk', intervention_summary: 'Single intake hook', pillar: 'shadow_ops' },
    ],
    agent8_validated_patterns: [],
    industry_triggers: [],
    pedro_frameworks_recently_used: [],
  },
  current_calendar: { scheduled_count: 0, pending_review_count: 0, published_this_week: 0, weeks_of_queue_remaining: 0.3, queue_low_warning: true },
};

describe('Sprint 13 — Agent 10 Content (sequential)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('forces all drafts to pending_pedro_review (LLM cannot self-approve)', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(RESEARCH))
      .mockResolvedValueOnce(fakeFallback(DRAFTS_TRYING_TO_APPROVE));

    const result = await runAgent10Content(INPUT);

    expect(result.final_output.drafter.drafts).toHaveLength(1);
    expect(result.final_output.drafter.drafts[0].approval_status).toBe('pending_pedro_review');
    expect(result.final_output.pedro_review_queue).toHaveLength(1);
  });

  it('flags low queue when under 1 week remaining', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(RESEARCH))
      .mockResolvedValueOnce(fakeFallback(DRAFTS_TRYING_TO_APPROVE));

    const result = await runAgent10Content(INPUT);
    expect(result.final_output.drafter.calendar_status.queue_low_warning).toBe(true);
    expect(result.requires_human_attention).toBe(true);
  });
});
