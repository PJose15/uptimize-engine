// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent11BusinessDevelopment } from '../../app/api/agents/run/operational/agent-11-business-development';
import type {
  Agent11Input,
  ProspectResearchResult,
  PipelineStageManagerResult,
  BdRecordView,
} from '../../app/api/agents/run/operational/agent-11-business-development';

const mockedExecute = vi.mocked(executeWithFallback);

const RESEARCH: ProspectResearchResult = {
  briefs: [
    {
      bd_record_id: 'bd-1',
      company: 'Acme Fitness Group',
      contact: 'Jane Doe',
      vertical: 'fitness',
      shadow_ops_signals_observed: ['WhatsApp CTA on website', 'Operations Coordinator hired'],
      shadow_ops_hypothesis: 'Coordination chaos pre-budget approval',
      observable_pain_evidence: ['Multi-location, no central booking'],
      recommended_opening_angle: 'Operations Coordinator hire signals chaos',
      three_questions_to_ask: ['Who knows when a class double-books?', 'What % of bookings need rescheduling?', 'What happens off-system?'],
      estimated_uptimize_fit_0_10: 8,
      research_completed_at: '2026-05-05T08:00:00Z',
    },
  ],
  research_missing_for: [],
};

const referralRecord: BdRecordView = {
  id: 'bd-2', type: 'referral', current_stage: 'identified',
  pipeline_value_usd: 0, company_name: 'Referred Studio',
  referred_by: 'client-1', is_stalled: false,
  days_since_last_contact: 0,
};

const PIPELINE: PipelineStageManagerResult = {
  records: [referralRecord],
  actions_today: [{ bd_record_id: 'bd-2', urgency: 'P2', description: 'Contact referred prospect within 48h', due_by: '2026-05-07' }],
  stalled: [],
  new_referrals: [referralRecord],
  partnerships_in_progress: [],
  weekly_metrics: { calls_booked: 2, proposals_in_close: 1, referrals_active: 1, pipeline_value_usd: 36000 },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'gemini-2.0-flash', provider: 'gemini' as const,
    usage: { input_tokens: 500, output_tokens: 350, total_tokens: 850 },
    cost_usd: 0.02, latency_ms: 1100,
    fallback_used: false, primary_provider: 'gemini' as const, attempts: 1,
  };
}

const INPUT: Agent11Input = {
  trigger: 'cron_daily',
  today: '2026-05-05',
  records: [referralRecord],
  upcoming_calls: [{ bd_record_id: 'bd-1', scheduled_at: '2026-05-06T14:00:00Z', counterparty_name: 'Jane Doe' }],
};

describe('Sprint 13 — Agent 11 Business Development (parallel)', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces research briefs + pipeline digest in parallel', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'prospect_research') return fakeFallback(RESEARCH);
      return fakeFallback(PIPELINE);
    });

    const result = await runAgent11BusinessDevelopment(INPUT);

    expect(result.final_output.research.briefs).toHaveLength(1);
    expect(result.final_output.pipeline.records).toHaveLength(1);
    expect(result.final_output.daily_digest.new_referrals_count).toBe(1);
  });

  it('escalates P2 when new referrals exist (48h rule)', async () => {
    mockedExecute.mockImplementation(async (taskProfile) => {
      if (taskProfile === 'prospect_research') return fakeFallback(RESEARCH);
      return fakeFallback(PIPELINE);
    });

    const result = await runAgent11BusinessDevelopment(INPUT);

    expect(result.requires_human_attention).toBe(true);
    expect(result.sub_agent_results[1].escalation_severity).toBe('P2');
  });
});
