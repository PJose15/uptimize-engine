// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/providers/fallback', () => ({
  executeWithFallback: vi.fn(),
}));

import { executeWithFallback } from '@/lib/providers/fallback';
import { runAgent1SubAgent, type Agent1Input } from '../../app/api/agents/run/uptimize/agent-1-market-intelligence';

const mockedExecute = vi.mocked(executeWithFallback);

const RESEARCH = {
  candidates: [
    {
      lead_id: 'lead-1',
      name: 'Jane Doe',
      company: 'Acme Fitness',
      role: 'Owner',
      segment: 'operator_smb',
      evidence_sources: [{ type: 'website', reference: 'acme.com', note: 'WhatsApp CTA on homepage' }],
      evidence_tier: 'Tier1',
      pain_categories: ['booking_chaos'],
      pillar_mapping: [{ pain: 'WhatsApp booking', pillar: 1, evidence: 'website CTA', tier: 'Tier1' }],
      shadow_ops_signals_observed: ['WhatsApp booking CTA'],
      exception_hypotheses_top3: ['Double-booking', 'Lost confirmations', 'Manual reschedules'],
      trigger_event: 'Posted Operations Coordinator role 3 days ago',
      stack_assumptions: [{ assumption: 'Uses spreadsheets', confidence: 'medium' }],
    },
  ],
  do_not_target: [],
  shadow_ops_insights: { top_signals_found: ['WhatsApp CTA'], common_exception_patterns: ['Double-booking'], notes: '' },
  research_notes: 'fitness vertical, Ponce',
  sources_used: ['brave_search', 'linkedin'],
};

const SCORING = {
  target_pack_primary: [
    {
      lead_id: 'lead-1',
      name: 'Jane Doe',
      company: 'Acme Fitness',
      role: 'Owner',
      segment: 'operator_smb',
      fit_score_0_100: 78,
      fit_score_breakdown: { pain_intensity: 17, urgency_trigger: 12, authority: 14, budget_likelihood: 10, complexity_fit: 10, tool_fit: 8, reachability: 7 },
      confidence_level: 'high',
      pain_categories: ['booking_chaos'],
      shadow_ops_density_0_10: 8,
      shadow_ops_rationale: 'WhatsApp CTA + spreadsheet ops',
      exception_hypotheses_top3: ['Double-booking', 'Lost confirmations', 'Manual reschedules'],
      trigger_event: 'Operations Coordinator role posted',
      what_to_say: 'Saw the Operations Coordinator hire — most ops hires we see in fitness are reactions to coordination chaos.',
      hooks: { primary_hook_140_chars: 'Saw the Ops Coordinator hire — usually a sign of coordination chaos. Worth 15 min?', backup_hook_140_chars: 'WhatsApp booking + spreadsheet ops = audit nightmare. Quick chat?' },
      pattern_interrupt_question: 'When a member double-books a class, who knows about it first — you or them?',
      cta: 'Reply YES and I will send the audit framework.',
      evidence_tier: 'Tier1',
      pillar_mapping: [{ pain: 'WhatsApp booking', pillar: 1, evidence: 'website CTA', tier: 'Tier1' }],
    },
  ],
  target_pack_secondary: [],
  angle_of_the_day: {
    primary_angle: 'Operations hire as proxy for coordination chaos',
    secondary_angle: 'WhatsApp CTAs as audit gap',
    pattern_interrupt_question: 'Who knows first when a member double-books?',
  },
};

function fakeFallback(content: unknown) {
  return {
    content: JSON.stringify(content),
    model_used: 'gemini-2.0-flash',
    provider: 'gemini' as const,
    usage: { input_tokens: 800, output_tokens: 600, total_tokens: 1400 },
    cost_usd: 0.02,
    latency_ms: 1200,
    fallback_used: false,
    primary_provider: 'gemini' as const,
    attempts: 1,
  };
}

const INPUT: Agent1Input = {
  query: '10 fitness studios in Ponce, Puerto Rico',
  queryIntent: { industry: 'fitness', location: 'Ponce, Puerto Rico', count: 10 },
  context: { offer_positioning: 'Operations automation' },
  mode: 'balanced',
};

describe('Sprint 12.3 — Agent 1 sub-agent orchestrator', () => {
  beforeEach(() => mockedExecute.mockReset());

  it('produces a TargetPackOutput from 1A research + 1B scoring', async () => {
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(RESEARCH))
      .mockResolvedValueOnce(fakeFallback(SCORING));

    const result = await runAgent1SubAgent(INPUT);

    expect(result.agent_id).toBe('agent-1-market-intelligence');
    expect(result.final_output.target_pack_primary).toHaveLength(1);
    expect(result.final_output.target_pack_primary[0].fit_score_0_100).toBe(78);
    expect(result.final_output.shadow_ops_insights.top_signals_found).toContain('WhatsApp CTA');
    expect(result.sub_agent_results[0].sub_agent_id).toBe('1A-research-specialist');
    expect(result.sub_agent_results[1].sub_agent_id).toBe('1B-scoring-analyst');
  });

  it('skips 1B when 1A produces no candidates (no extra LLM call)', async () => {
    const emptyResearch = { ...RESEARCH, candidates: [] };
    mockedExecute.mockResolvedValueOnce(fakeFallback(emptyResearch));

    const result = await runAgent1SubAgent(INPUT);

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(result.final_output.target_pack_primary).toHaveLength(0);
  });

  it('recomputes fit_score when breakdown drifts > 2 from total', async () => {
    const driftedScoring = {
      ...SCORING,
      target_pack_primary: [{
        ...SCORING.target_pack_primary[0],
        fit_score_0_100: 99, // claimed 99, breakdown sums to 78
      }],
    };
    mockedExecute
      .mockResolvedValueOnce(fakeFallback(RESEARCH))
      .mockResolvedValueOnce(fakeFallback(driftedScoring));

    const result = await runAgent1SubAgent(INPUT);
    expect(result.final_output.target_pack_primary[0].fit_score_0_100).toBe(78); // recomputed from breakdown
  });
});
